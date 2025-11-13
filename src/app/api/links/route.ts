import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkUrlSafety } from '@/lib/safeBrowsing'
import crypto from 'crypto'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const links = await prisma.link.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(links)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { longUrl, customUrl } = await request.json()

  if (!longUrl) {
    return NextResponse.json({ error: 'URL asli diperlukan.' }, { status: 400 })
  }

  // Validate URL format
  try {
    new URL(longUrl)
  } catch {
    return NextResponse.json({ error: 'URL tidak valid.' }, { status: 400 })
  }

  // Check URL length
  if (longUrl.length > 2048) {
    return NextResponse.json({ error: 'URL terlalu panjang (max 2048 karakter).' }, { status: 400 })
  }

  // Check safety
  const isSafe = await checkUrlSafety(longUrl)
  if (!isSafe) {
    return NextResponse.json({ error: 'URL terdeteksi berbahaya.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
  }

  // Check limits
  const maxMonthly = user.role === 'STUDENT' ? 5 : 10
  const maxTotal = user.role === 'STUDENT' ? 100 : 200

  if (user.monthlyLinksCreated >= maxMonthly) {
    return NextResponse.json({ error: 'Batas link bulanan tercapai.' }, { status: 400 })
  }

  if (user.totalLinks >= maxTotal) {
    return NextResponse.json({ error: 'Batas total link tercapai.' }, { status: 400 })
  }

  let shortUrl = customUrl

  if (customUrl) {
    // Validate custom URL
    if (customUrl.length > 255 || !/^[a-zA-Z0-9-_]+$/.test(customUrl)) {
      return NextResponse.json({ error: 'Short URL kustom tidak valid.' }, { status: 400 })
    }

    // Check if custom URL is taken
    const existing = await prisma.link.findUnique({
      where: { shortUrl: customUrl },
    })

    if (existing) {
      return NextResponse.json({ error: 'Short URL kustom sudah digunakan.' }, { status: 400 })
    }
  } else {
    // Generate random short URL
    let attempts = 0
    do {
      shortUrl = crypto.randomBytes(3).toString('hex') // 6 characters
      attempts++
      if (attempts > 10) {
        return NextResponse.json({ error: 'Gagal menghasilkan short URL.' }, { status: 500 })
      }
    } while (await prisma.link.findUnique({ where: { shortUrl } }))
  }

  // Create link
  const link = await prisma.link.create({
    data: {
      shortUrl,
      longUrl,
      userId: session.user.id,
      custom: !!customUrl,
    },
  })

  // Update user counters
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      monthlyLinksCreated: { increment: 1 },
      totalLinks: { increment: 1 },
    },
  })

  return NextResponse.json(link)
}