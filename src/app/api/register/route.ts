import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sendEmail } from '@/lib/email'
import { getVerificationEmailHtml } from '@/lib/email-templates'
import { db } from '@/lib/db'
import { withRateLimit } from '@/lib/rateLimit'
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

    // Check if user exists by email using raw SQL
    const existingUserResult = await db.query(
      'SELECT id FROM "User" WHERE email = $1',
      [email]
    )

    if (existingUserResult.rows.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 400 })
    }

    // Check if nimOrUsername is unique using raw SQL
    const existingUsernameResult = await db.query(
      'SELECT id FROM "User" WHERE "nimOrUsername" = $1',
      [nimOrUsername]
    )

    if (existingUsernameResult.rows.length > 0) {
      return NextResponse.json({ error: 'NIM/Username sudah digunakan.' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Create user using raw SQL with RETURNING clause
    await db.query(
      `INSERT INTO "User" (
        id, email, role, "nimOrUsername", password,
        "verificationToken", "verificationTokenExpires", "createdAt", "updatedAt"
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [email, role, nimOrUsername, hashedPassword, verificationCode, verificationTokenExpires]
    )

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