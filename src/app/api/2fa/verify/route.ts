import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withRateLimit } from '@/lib/rateLimit'

async function handle2FAVerify(request: NextRequest) {
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
      twoFactorSetupCode: true,
      verificationTokenExpires: true
    }
  })

  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
  }

  if (user.twoFactorEnabled) {
    return NextResponse.json({ error: '2FA sudah diaktifkan.' }, { status: 400 })
  }

  if (!user.twoFactorSetupCode || !user.verificationTokenExpires) {
    return NextResponse.json({ error: 'Kode verifikasi belum diminta.' }, { status: 400 })
  }

  if (new Date(user.verificationTokenExpires) < new Date()) {
    return NextResponse.json({ error: 'Kode verifikasi telah kadaluarsa.' }, { status: 400 })
  }

  if (user.twoFactorSetupCode !== code) {
    return NextResponse.json({ error: 'Kode verifikasi salah.' }, { status: 400 })
  }

  // Enable 2FA using Prisma
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorEnabled: true,
      twoFactorSetupCode: null,
      verificationTokenExpires: null,
      updatedAt: new Date()
    }
  })

  return NextResponse.json({ message: '2FA berhasil diaktifkan.' })
}

export const POST = withRateLimit(handle2FAVerify, { limit: 5, windowMs: 10 * 60 * 1000 }) // 5 attempts per 10 minutes
