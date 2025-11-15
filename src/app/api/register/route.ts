import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { role, nimOrUsername, password, agreedToTerms, turnstileToken } = await request.json()

    // Validate terms acceptance
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

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 400 })
    }

    // Check nimOrUsername unique
    const existingNimOrUsername = await prisma.user.findUnique({
      where: { nimOrUsername },
    })

    if (existingNimOrUsername) {
      return NextResponse.json({ error: 'NIM/Username sudah digunakan.' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        role,
        nimOrUsername,
        password: hashedPassword,
        verificationToken,
        verificationTokenExpires,
      },
    })

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