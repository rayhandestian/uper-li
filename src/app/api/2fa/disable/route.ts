import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withRateLimit } from '@/lib/rateLimit'

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
async function handleDisable2FA(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user using Prisma
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      twoFactorEnabled: true
    }
  })

  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
  }

  if (!user.twoFactorEnabled) {
    return NextResponse.json({ error: '2FA belum diaktifkan.' }, { status: 400 })
  }

  // Disable 2FA using Prisma
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      updatedAt: new Date()
    }
  })

  return NextResponse.json({ message: '2FA berhasil dinonaktifkan.' })
}

export const POST = withRateLimit(handleDisable2FA, { limit: 3, windowMs: 60 * 60 * 1000 }) // 3 attempts per hour