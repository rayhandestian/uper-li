import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const RESERVED_PATHS = [
  'dashboard',
  'login',
  'register',
  'terms',
  'privacy',
  'contact',
  'verify',
  'admin'
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { active, shortUrl, mode, password } = await request.json()
  const { id } = await params

  // Get link using Prisma
  const link = await prisma.link.findFirst({
    where: {
      id,
      userId: session.user.id
    }
  })

  if (!link) {
    return NextResponse.json({ error: 'Link tidak ditemukan.' }, { status: 404 })
  }

  // Build dynamic update data
  const updateData: {
    active?: boolean
    mode?: string
    password?: string | null
    shortUrl?: string
    custom?: boolean
    customChanges?: number
    customChangedAt?: Date
    updatedAt: Date
  } = {
    updatedAt: new Date()
  }

  if (active !== undefined) {
    updateData.active = active
  }

  if (mode !== undefined) {
    updateData.mode = mode
  }

  if (password !== undefined) {
    if (password === '') {
      updateData.password = null
    } else if (password.length >= 4) {
      updateData.password = await bcrypt.hash(password, 12)
    } else {
      return NextResponse.json({ error: 'Password minimal 4 karakter.' }, { status: 400 })
    }
  }

  if (shortUrl !== undefined) {
    // Check if custom URL change is allowed (max 2 per month)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    if (link.customChangedAt && link.customChangedAt >= startOfMonth) {
      if ((link.customChanges || 0) >= 2) {
        return NextResponse.json({ error: 'Batas perubahan custom URL per bulan tercapai (maksimal 2x).' }, { status: 400 })
      }
    } else {
      // Reset counter for new month
      updateData.customChanges = 1
      updateData.customChangedAt = now
    }

    // Validate new short URL
    if (shortUrl.length > 255 || !/^[a-zA-Z0-9-_]+$/.test(shortUrl)) {
      return NextResponse.json({ error: 'Short URL kustom tidak valid.' }, { status: 400 })
    }

    // Check if new short URL is reserved
    if (RESERVED_PATHS.includes(shortUrl)) {
      return NextResponse.json({ error: 'Short URL kustom tidak tersedia.' }, { status: 400 })
    }

    // Check if new short URL is taken
    const existing = await prisma.link.findUnique({
      where: { shortUrl },
      select: { id: true }
    })

    if (existing && existing.id !== id) {
      return NextResponse.json({ error: 'Short URL kustom sudah digunakan.' }, { status: 400 })
    }

    updateData.shortUrl = shortUrl
    updateData.custom = true
    updateData.customChanges = (link.customChanges || 0) + 1
  }

  if (Object.keys(updateData).length === 1) { // Only updatedAt
    return NextResponse.json({ error: 'Tidak ada data untuk diperbarui.' }, { status: 400 })
  }

  // Update link using Prisma
  const updatedLink = await prisma.link.update({
    where: { id },
    data: updateData
  })

  return NextResponse.json(updatedLink)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Get link using Prisma
  const link = await prisma.link.findFirst({
    where: {
      id,
      userId: session.user.id
    }
  })

  if (!link) {
    return NextResponse.json({ error: 'Link tidak ditemukan.' }, { status: 404 })
  }

  // Use Prisma transaction for atomic delete
  await prisma.$transaction(async (tx) => {
    // Delete link
    await tx.link.delete({
      where: { id }
    })

    // Update user counters
    const createdAt = link.createdAt
    const now = new Date()
    const isCurrentMonth = createdAt &&
      createdAt.getMonth() === now.getMonth() &&
      createdAt.getFullYear() === now.getFullYear()

    const updateData: {
      totalLinks: { decrement: number }
      monthlyLinksCreated?: { decrement: number }
    } = {
      totalLinks: { decrement: 1 }
    }

    if (isCurrentMonth) {
      updateData.monthlyLinksCreated = { decrement: 1 }
    }

    await tx.user.update({
      where: { id: session.user.id },
      data: updateData
    })
  })

  return NextResponse.json({ message: 'Link berhasil dihapus.' })
}