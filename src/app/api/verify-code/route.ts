import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Kode verifikasi diperlukan dan harus 6 digit.' }, { status: 400 })
    }

    // Find user by verification code using raw SQL
    const userResult = await db.query(
      'SELECT * FROM "User" WHERE "verificationToken" = $1',
      [code]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Kode verifikasi tidak valid.' }, { status: 400 })
    }

    const user = userResult.rows[0]

    // Check if code has expired
    if (user.verificationTokenExpires && new Date(user.verificationTokenExpires) < new Date()) {
      return NextResponse.json({ error: 'Kode verifikasi telah kadaluarsa.' }, { status: 400 })
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Akun sudah diverifikasi.' }, { status: 400 })
    }

    // Verify email using raw SQL
    await db.query(
      `UPDATE "User"
       SET "emailVerified" = NOW(), "verificationToken" = null, "verificationTokenExpires" = null, "updatedAt" = NOW()
       WHERE id = $1`,
      [user.id]
    )

    return NextResponse.json({ message: 'Verifikasi berhasil.' })
  } catch (error) {
    console.error('Code verification error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}