import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token diperlukan.' }, { status: 400 })
    }

    // Find user by verification token using raw SQL
    const userResult = await db.query(
      'SELECT * FROM "User" WHERE "verificationToken" = $1',
      [token]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Token verifikasi tidak valid.' }, { status: 400 })
    }

    const user = userResult.rows[0]

    // Check if token has expired
    if (user.verificationTokenExpires && new Date(user.verificationTokenExpires) < new Date()) {
      return NextResponse.json({ error: 'Token verifikasi telah kadaluarsa.' }, { status: 400 })
    }

    // Verify email using raw SQL
    await db.query(
      `UPDATE "User" 
       SET "emailVerified" = NOW(), "verificationToken" = null, "verificationTokenExpires" = null, "updatedAt" = NOW()
       WHERE id = $1`,
      [user.id]
    )

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?verified=true`)
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}