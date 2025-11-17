import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user using raw SQL
  const userResult = await db.query(
    'SELECT * FROM "User" WHERE id = $1',
    [session.user.id]
  )

  if (userResult.rows.length === 0) {
    return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
  }

  const user = userResult.rows[0]

  if (user.twoFactorEnabled) {
    return NextResponse.json({ error: '2FA sudah diaktifkan.' }, { status: 400 })
  }

  // Generate verification code
  const verificationCode = crypto.randomInt(100000, 999999).toString()
  const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Update user with verification code using raw SQL
  await db.query(
    `UPDATE "User" 
     SET "twoFactorSecret" = $1, "verificationTokenExpires" = $2, "updatedAt" = NOW()
     WHERE id = $3`,
    [verificationCode, verificationCodeExpires, session.user.id]
  )

  // Send verification email
  try {
    await sendEmail({
      to: user.email,
      from: 'noreply@uper.li',
      subject: 'Verifikasi Aktivasi 2FA - UPer.li',
      html: `
        <p>Halo ${user.nimOrUsername},</p>
        <p>Anda telah meminta untuk mengaktifkan Two-Factor Authentication (2FA) pada akun UPer.li Anda.</p>
        <p>Kode verifikasi Anda: <strong>${verificationCode}</strong></p>
        <p>Kode ini akan kadaluarsa dalam 10 menit.</p>
        <p>Jika Anda tidak meminta aktivasi 2FA, abaikan email ini.</p>
        <p>Salam,<br>Tim UPer.li</p>
      `,
    })

    return NextResponse.json({ message: 'Kode verifikasi telah dikirim ke email Anda.' })
  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json({ error: 'Gagal mengirim email verifikasi.' }, { status: 500 })
  }
}