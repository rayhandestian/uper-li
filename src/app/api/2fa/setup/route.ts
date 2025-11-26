import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { get2FAVerificationEmailHtml } from '@/lib/email-templates'
import { withRateLimit } from '@/lib/rateLimit'
import { generateSecureCode } from '@/lib/generateSecureCode'
import { logger } from '@/lib/logger'

async function handle2FASetup() {
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
      twoFactorEnabled: true
    }
  })

  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
  }

  if (user.twoFactorEnabled) {
    return NextResponse.json({ error: '2FA sudah diaktifkan.' }, { status: 400 })
  }

  // Generate secure alphanumeric verification code
  const verificationCode = generateSecureCode()
  const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Update user with verification code using Prisma
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorSetupCode: verificationCode,
      verificationTokenExpires: verificationCodeExpires,
      updatedAt: new Date()
    }
  })

  // Send verification email
  try {
    await sendEmail({
      to: user.email,
      from: 'noreply@uper.li',
      subject: 'Verifikasi Aktivasi 2FA - UPer.li',
      html: get2FAVerificationEmailHtml(user.nimOrUsername, verificationCode),
    })

    return NextResponse.json({ message: 'Kode verifikasi telah dikirim ke email Anda.' })
  } catch (error) {
    logger.error('Email sending error:', error)
    return NextResponse.json({ error: 'Gagal mengirim email verifikasi.' }, { status: 500 })
  }
}

export const POST = withRateLimit(handle2FASetup, { limit: 3, windowMs: 60 * 60 * 1000 }) // 3 attempts per hour
