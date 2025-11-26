import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withRateLimit } from '@/lib/rateLimit'

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user using Prisma
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      nimOrUsername: true,
      role: true,
      emailVerified: true,
      twoFactorEnabled: true,
      monthlyLinksCreated: true,
      totalLinks: true,
      createdAt: true
    }
  })

  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
  }

  return NextResponse.json(user)
}

async function handleUpdateProfile(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name } = await request.json()

  // Update user using Prisma
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      updatedAt: new Date()
    }
  })

  return NextResponse.json({ message: 'Profil berhasil diperbarui.' })
}

export const PATCH = withRateLimit(handleUpdateProfile, { limit: 6, windowMs: 60 * 60 * 1000 }) // 6 attempts per hour