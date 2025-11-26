import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withRateLimit } from '@/lib/rateLimit'

async function handle2FAVerification(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code } = await request.json()

  if (!code) {
    return NextResponse.json({ error: 'Kode verifikasi diperlukan.' }, { status: 400 })
  }

  // Get user using Prisma
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      twoFactorEnabled: true,
      twoFactorLoginCode: true,
      verificationTokenExpires: true
    }
  })

  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
  }

  if (!user.twoFactorEnabled) {
    return NextResponse.json({ error: '2FA tidak diaktifkan.' }, { status: 400 })
  }

  if (!user.twoFactorLoginCode || !user.verificationTokenExpires) {
    return NextResponse.json({ error: 'Kode verifikasi tidak ditemukan.' }, { status: 400 })
  }

  if (new Date(user.verificationTokenExpires) < new Date()) {
    return NextResponse.json({ error: 'Kode verifikasi telah kadaluarsa.' }, { status: 400 })
  }

  if (user.twoFactorLoginCode !== code) {
    return NextResponse.json({ error: 'Kode verifikasi salah.' }, { status: 400 })
  }

  // Clear the temporary 2FA code using Prisma
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorLoginCode: null,
      verificationTokenExpires: null,
      updatedAt: new Date()
    }
  })

  return NextResponse.json({ message: 'Verifikasi 2FA berhasil.' })
}

export const POST = withRateLimit(handle2FAVerification, { limit: 5, windowMs: 10 * 60 * 1000 }) // 5 attempts per 10 minutes
