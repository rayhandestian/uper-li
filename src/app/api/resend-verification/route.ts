import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { getVerificationEmailHtml } from '@/lib/email-templates'
import { prisma } from '@/lib/prisma'
import { withRateLimit } from '@/lib/rateLimit'
import { generateSecureCode } from '@/lib/generateSecureCode'
import { logger } from '@/lib/logger'

async function handleResendVerification(request: NextRequest) {
  try {
    const { nimOrUsername } = await request.json()

    if (!nimOrUsername) {
      return NextResponse.json({ error: 'NIM/Username diperlukan.' }, { status: 400 })
    }

    // Find user by nimOrUsername using Prisma
    const user = await prisma.user.findUnique({
      where: { nimOrUsername },
      select: { id: true, email: true, role: true, emailVerified: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 })
    }

    // Check if user is already verified
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Akun sudah diverifikasi. Silakan masuk.' }, { status: 400 })
    }

    // Generate secure alphanumeric verification code
    const verificationCode = generateSecureCode()
    const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Update user's verification token and expiry using Prisma
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: verificationCode,
        verificationTokenExpires,
        updatedAt: new Date()
      }
    })

    // Send verification email
    await sendEmail({
      to: user.email,
      from: 'noreply@uper.li',
      subject: 'Verifikasi Akun UPer.li',
      html: getVerificationEmailHtml(verificationCode),
    })

    logger.info(`Verification code resent for user`, {
      userId: user.id,
      nimOrUsername,
      timestamp: new Date()
    })

    return NextResponse.json({ message: 'Kode verifikasi baru telah dikirim ke email Anda.' })
  } catch (error) {
    logger.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

export const POST = withRateLimit(handleResendVerification, { limit: 3, windowMs: 60 * 60 * 1000 }) // 3 attempts per hour