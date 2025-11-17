import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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

  if (!user.twoFactorEnabled) {
    return NextResponse.json({ error: '2FA belum diaktifkan.' }, { status: 400 })
  }

  // Disable 2FA using raw SQL
  await db.query(
    `UPDATE "User" 
     SET "twoFactorEnabled" = false, "twoFactorSecret" = null, "updatedAt" = NOW()
     WHERE id = $1`,
    [session.user.id]
  )

  return NextResponse.json({ message: '2FA berhasil dinonaktifkan.' })
}