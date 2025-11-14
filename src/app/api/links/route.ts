import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkUrlSafety } from '@/lib/safeBrowsing'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''
  const active = searchParams.get('active')
  const sort = searchParams.get('sort') || 'createdAt'
  const order = searchParams.get('order') || 'desc'

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {
    userId: session.user.id,
  }

  if (search) {
    where.OR = [
      { shortUrl: { contains: search, mode: 'insensitive' } },
      { longUrl: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (active !== null && active !== undefined) {
    where.active = active === 'true'
  }

  // Build orderBy
  const orderBy: any = {}
  orderBy[sort] = order

  // Get total count for pagination
  const total = await prisma.link.count({ where })

  // Get paginated links
  const links = await prisma.link.findMany({
    where,
    orderBy,
    skip,
    take: limit,
  })

  const totalPages = Math.ceil(total / limit)

  return NextResponse.json({
    links,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { longUrl, customUrl, password } = await request.json()

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

  // Hash password if provided
  let hashedPassword = null
  if (password) {
    if (password.length < 4) {
      return NextResponse.json({ error: 'Password minimal 4 karakter.' }, { status: 400 })
    }
    hashedPassword = await bcrypt.hash(password, 12)
  }

  // Create link
  const link = await prisma.link.create({
    data: {
      shortUrl,
      longUrl,
      userId: session.user.id,
      custom: !!customUrl,
      password: hashedPassword,
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