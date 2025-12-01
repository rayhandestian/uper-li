import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { getVerificationEmailHtml } from '@/lib/email-templates'
import { prisma } from '@/lib/prisma'
import { withRateLimit } from '@/lib/rateLimit'
import { generateSecureCode } from '@/lib/generateSecureCode'
import { addConstantDelay } from '@/lib/timing'
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

    // Always return success message to prevent enumeration
    // Only send email if account exists AND not verified
    if (user && !user.emailVerified) {
      // Generate secure alphanumeric verification code
      const verificationCode = generateSecureCode()
      const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Regenerate session token for auto-login after verification
      const sessionToken = generateSecureCode()
      const sessionTokenExpires = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

      // Update user's verification token and expiry using Prisma
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken: verificationCode,
          verificationTokenExpires,
          sessionToken,
          sessionTokenExpires,
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
    } else {
      // Add delay to prevent timing attacks when user doesn't exist or is already verified
      await addConstantDelay(50, 100)
    }

    // Always return success to prevent enumeration
    return NextResponse.json({ message: 'Jika akun ditemukan, kode verifikasi telah dikirim ke email Anda.' })
  } catch (error) {
    logger.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

export const POST = withRateLimit(handleResendVerification, { limit: 3, windowMs: 60 * 60 * 1000 }) // 3 attempts per hour