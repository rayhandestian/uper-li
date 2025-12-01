import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sendEmail } from '@/lib/email'
import { getVerificationEmailHtml } from '@/lib/email-templates'
import { prisma } from '@/lib/prisma'
import { withRateLimit } from '@/lib/rateLimit'
import { generateSecureCode } from '@/lib/generateSecureCode'
import { addConstantDelay } from '@/lib/timing'
import { logger } from '@/lib/logger'

async function handleRegistration(request: NextRequest) {
  try {
    const { role, nimOrUsername, password, agreedToTerms, turnstileToken } = await request.json()

    if (!agreedToTerms) {
      return NextResponse.json({ error: 'Anda harus menyetujui Syarat dan Ketentuan.' }, { status: 400 })
    }

    // Validate Turnstile
    const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.CLOUDFLARE_TURNSTILE_SECRET!,
        response: turnstileToken,
      }),
    })

    const turnstileData = await turnstileResponse.json()
    if (!turnstileData.success) {
      return NextResponse.json({ error: 'Verifikasi CAPTCHA gagal.' }, { status: 400 })
    }

    // Construct email
    const email = role === 'STUDENT'
      ? `${nimOrUsername}@student.universitaspertamina.ac.id`
      : `${nimOrUsername}@universitaspertamina.ac.id`

    // Check if user exists by email using Prisma
    let existingUserByEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true, createdAt: true }
    })

    // Check if nimOrUsername is unique using Prisma
    let existingUserByUsername = await prisma.user.findUnique({
      where: { nimOrUsername },
      select: { id: true, emailVerified: true, createdAt: true }
    })

    // Clean up old unverified users (older than 12 hours)
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000)

    if (existingUserByEmail && !existingUserByEmail.emailVerified && existingUserByEmail.createdAt && existingUserByEmail.createdAt < twelveHoursAgo) {
      await prisma.user.delete({ where: { id: existingUserByEmail.id } })
      existingUserByEmail = null
    }

    if (existingUserByUsername && !existingUserByUsername.emailVerified && existingUserByUsername.createdAt && existingUserByUsername.createdAt < twelveHoursAgo) {
      await prisma.user.delete({ where: { id: existingUserByUsername.id } })
      existingUserByUsername = null
    }

    // If either exists, return generic error to prevent enumeration
    if (existingUserByEmail || existingUserByUsername) {
      await addConstantDelay(50, 100)
      return NextResponse.json({ error: 'Registrasi gagal. Silakan periksa data Anda.' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate secure alphanumeric verification code
    const verificationCode = generateSecureCode()
    const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Generate session token for auto-login after verification
    const sessionToken = generateSecureCode()
    const sessionTokenExpires = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Create user using Prisma
    await prisma.user.create({
      data: {
        email,
        role,
        nimOrUsername,
        password: hashedPassword,
        verificationToken: verificationCode,
        verificationTokenExpires,
        sessionToken,
        sessionTokenExpires,
      }
    })

    // Send verification email
    await sendEmail({
      to: email,
      from: 'noreply@uper.li',
      subject: 'Verifikasi Akun UPer.li',
      html: getVerificationEmailHtml(verificationCode),
    })

    return NextResponse.json({ message: 'Registrasi berhasil. Silakan cek email untuk verifikasi.' })
  } catch (error) {
    logger.error('Registration error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

export const POST = withRateLimit(handleRegistration, { limit: 5, windowMs: 30 * 60 * 1000 }) // 5 attempts per 30 minutes