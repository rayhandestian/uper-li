import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { role, nimOrUsername, password, turnstileToken } = await request.json()

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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create user using raw SQL with RETURNING clause
    const userResult = await db.query(
      `INSERT INTO "User" (
        id, email, role, "nimOrUsername", password, 
        "verificationToken", "verificationTokenExpires", "createdAt", "updatedAt"
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()) 
      RETURNING id`,
      [email, role, nimOrUsername, hashedPassword, verificationToken, verificationTokenExpires]
    )

    const user = userResult.rows[0]

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/verify-email?token=${verificationToken}`
    await sendEmail({
      to: email,
      from: 'noreply@uper.li',
      subject: 'Verifikasi Akun UPer.li',
      html: `
        <p>Halo,</p>
        <p>Terima kasih telah mendaftar di UPer.li. Klik link berikut untuk verifikasi akun Anda:</p>
        <a href="${verificationUrl}">Verifikasi Akun</a>
        <p>Link ini akan kadaluarsa dalam 24 jam.</p>
        <p>Jika Anda tidak mendaftar, abaikan email ini.</p>
      `,
    })

    return NextResponse.json({ message: 'Registrasi berhasil. Silakan cek email untuk verifikasi.' })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}