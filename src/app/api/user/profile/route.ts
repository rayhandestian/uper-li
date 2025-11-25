import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { withRateLimit } from '@/lib/rateLimit'

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user using raw SQL
  const userResult = await db.query(
    'SELECT id, email, "nimOrUsername", role, "emailVerified", "twoFactorEnabled", "monthlyLinksCreated", "totalLinks", "createdAt" FROM "User" WHERE id = $1',
    [session.user.id]
  )

  if (userResult.rows.length === 0) {
    return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
  }

  return NextResponse.json(userResult.rows[0])
}

async function handleUpdateProfile(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name } = await request.json()

  // Update user using raw SQL
  await db.query(
    `UPDATE "User" 
     SET name = $1, "updatedAt" = NOW()
     WHERE id = $2`,
    [name, session.user.id]
  )

  return NextResponse.json({ message: 'Profil berhasil diperbarui.' })
}

export const PATCH = withRateLimit(handleUpdateProfile, { limit: 5, windowMs: 60 * 60 * 1000 }) // 5 attempts per hour