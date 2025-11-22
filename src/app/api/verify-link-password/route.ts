import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { shortUrl, password } = await request.json()

    if (!shortUrl || !password) {
      return NextResponse.json({ error: 'Short URL dan password diperlukan.' }, { status: 400 })
    }

    const linkResult = await db.query(
      'SELECT * FROM "Link" WHERE "shortUrl" = $1',
      [shortUrl]
    )

    if (linkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Link tidak ditemukan.' }, { status: 404 })
    }

    const link = linkResult.rows[0]

    if (!link.password) {
      return NextResponse.json({ error: 'Link ini tidak memerlukan password.' }, { status: 400 })
    }

    const isValidPassword = await bcrypt.compare(password, link.password)

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Password salah.' }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Password verification error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}