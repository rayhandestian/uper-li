import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sendEmail } from '@/lib/email'
import { getVerificationEmailHtml } from '@/lib/email-templates'
import { prisma } from '@/lib/prisma'
import { withRateLimit } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

async function handleResendVerification(request: NextRequest) {
  try {
    const { nimOrUsername, password } = await request.json()

    if (!nimOrUsername) {
      return NextResponse.json({ error: 'NIM/Username diperlukan.' }, { status: 400 })
    }

    if (password && password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 })
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

    // Generate new 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Prepare update data
    const updateData: {
      verificationToken: string
      verificationTokenExpires: Date
      updatedAt: Date
      password?: string
    } = {
      verificationToken: verificationCode,
      verificationTokenExpires,
      updatedAt: new Date()
    }

    if (password) {
      // Hash password if provided
      const hashedPassword = await bcrypt.hash(password, 12)
      updateData.password = hashedPassword

      // Log password update for security
      logger.info(`Password updated for user during resend verification`, {
        userId: user.id,
        nimOrUsername,
        timestamp: new Date()
      })
    }

    // Update user's verification token and expiry (and password if provided) using Prisma
    await prisma.user.update({
      where: { id: user.id },
      data: updateData
    })

    // Send verification email
    await sendEmail({
      to: user.email,
      from: 'noreply@uper.li',
      subject: 'Verifikasi Akun UPer.li',
      html: getVerificationEmailHtml(verificationCode),
    })

    const message = password
      ? 'Password berhasil diubah dan kode verifikasi baru telah dikirim ke email Anda.'
      : 'Kode verifikasi baru telah dikirim ke email Anda.'

    return NextResponse.json({ message })
  } catch (error) {
    logger.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

export const POST = withRateLimit(handleResendVerification, { limit: 3, windowMs: 60 * 60 * 1000 }) // 3 attempts per hour