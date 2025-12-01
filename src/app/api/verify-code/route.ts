import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAccountLocked, recordFailedAttempt, clearAttempts } from '@/lib/verificationAttempts'
import { withRateLimit } from '@/lib/rateLimit'
import { normalizeCode } from '@/lib/generateSecureCode'
import { logger } from '@/lib/logger'

async function handleVerification(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code || code.length !== 6) {
      logger.warn(`Invalid verification code format`, { codeLength: code?.length })
      return NextResponse.json({ error: 'Kode verifikasi diperlukan dan harus 6 karakter.' }, { status: 400 })
    }

    // Find user by verification code
    const user = await prisma.user.findFirst({
      where: { verificationToken: normalizeCode(code) },
      select: {
        id: true,
        email: true,
        nimOrUsername: true,
        role: true,
        emailVerified: true,
        verificationTokenExpires: true,
        sessionToken: true,
        sessionTokenExpires: true,
        updatedAt: true
      }
    })

    if (!user) {
      logger.info(`Invalid verification code attempt`, { code: code.substring(0, 2) + '****' })
      return NextResponse.json({ error: 'Kode verifikasi tidak valid.' }, { status: 400 })
    }

    // Check if account is locked due to too many failed attempts
    const locked = await isAccountLocked(user.id, 'email_verification')
    if (locked) {
      logger.warn(`Account locked for verification attempts`, { userId: user.id })
      return NextResponse.json({ error: 'Akun terkunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam 1 jam.' }, { status: 429 })
    }

    // Check if code has expired
    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      await recordFailedAttempt(user.id, 'email_verification')
      logger.warn(`Expired verification code attempt`, { userId: user.id, code: code.substring(0, 2) + '****' })
      return NextResponse.json({ error: 'Kode verifikasi telah kadaluarsa.' }, { status: 400 })
    }

    // Check if already verified
    if (user.emailVerified) {
      logger.warn(`Already verified account attempt`, { userId: user.id, code: code.substring(0, 2) + '****' })
      return NextResponse.json({ error: 'Akun sudah diverifikasi.' }, { status: 400 })
    }

    // Additional security: Check if verification code was generated recently (within 24 hours)
    const verificationTokenGenerated = user.updatedAt
    const now = new Date()
    const tokenAge = now.getTime() - (verificationTokenGenerated?.getTime() || 0)
    const maxTokenAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

    if (tokenAge > maxTokenAge) {
      await recordFailedAttempt(user.id, 'email_verification')
      logger.warn(`Old verification code attempt`, {
        userId: user.id,
        tokenAge: Math.round(tokenAge / (1000 * 60 * 60)) + ' hours',
        code: code.substring(0, 2) + '****'
      })
      return NextResponse.json({ error: 'Kode verifikasi telah kadaluarsa. Silakan daftar ulang.' }, { status: 400 })
    }

    // Log successful verification attempt
    logger.info(`Successful verification`, {
      userId: user.id,
      nimOrUsername: user.nimOrUsername,
      role: user.role
    })

    // Verify email and clear verification token (but keep session token for auto-login)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpires: null,
        updatedAt: new Date()
      }
    })

    // Clear failed attempts on successful verification
    await clearAttempts(user.id, 'email_verification')

    // Return session token if it exists and hasn't expired
    const sessionTokenValid = user.sessionToken &&
      user.sessionTokenExpires &&
      user.sessionTokenExpires > now

    return NextResponse.json({
      message: 'Verifikasi berhasil.',
      sessionToken: sessionTokenValid ? user.sessionToken : null
    })
  } catch (error) {
    logger.error('Code verification error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

export const POST = withRateLimit(handleVerification, { limit: 10, windowMs: 60 * 60 * 1000 }) // 10 attempts per hour per IP
