import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

const RESERVED_PATHS = [
  'dashboard',
  'login',
  'register',
  'terms',
  'privacy',
  'contact',
  'verify',
  'admin'
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { active, shortUrl, mode, password } = await request.json()
  const { id } = await params

  // Get link using raw SQL
  const linkResult = await db.query(
    'SELECT * FROM "Link" WHERE id = $1 AND "userId" = $2',
    [id, session.user.id]
  )

  if (linkResult.rows.length === 0) {
    return NextResponse.json({ error: 'Link tidak ditemukan.' }, { status: 404 })
  }

  const link = linkResult.rows[0]

  // Build dynamic update query
  const updateFields = []
  const queryParams: unknown[] = [id, session.user.id]
  let paramIndex = 3

  if (active !== undefined) {
    updateFields.push(`active = $${paramIndex}`)
    queryParams.push(active)
    paramIndex++
  }

  if (mode !== undefined) {
    updateFields.push(`mode = $${paramIndex}`)
    queryParams.push(mode)
    paramIndex++
  }

  if (password !== undefined) {
    if (password === '') {
      // Remove password
      updateFields.push(`password = $${paramIndex}`)
      queryParams.push(null)
      paramIndex++
    } else if (password.length >= 4) {
      // Set new password
      const hashedPassword = await bcrypt.hash(password, 12)
      updateFields.push(`password = $${paramIndex}`)
      queryParams.push(hashedPassword)
      paramIndex++
    } else {
      return NextResponse.json({ error: 'Password minimal 4 karakter.' }, { status: 400 })
    }
  }

  if (shortUrl !== undefined) {
    // Check if custom URL change is allowed (max 2 per month)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    if (link.customChangedAt && new Date(link.customChangedAt) >= startOfMonth) {
      if (link.customChanges >= 2) {
        return NextResponse.json({ error: 'Batas perubahan custom URL per bulan tercapai (maksimal 2x).' }, { status: 400 })
      }
    } else {
      // Reset counter for new month
      updateFields.push(`customChanges = 1`)
      updateFields.push(`"customChangedAt" = $${paramIndex}`)
      queryParams.push(now)
      paramIndex++
    }

    // Validate new short URL
    if (shortUrl.length > 255 || !/^[a-zA-Z0-9-_]+$/.test(shortUrl)) {
      return NextResponse.json({ error: 'Short URL kustom tidak valid.' }, { status: 400 })
    }

    // Check if new short URL is reserved
    if (RESERVED_PATHS.includes(shortUrl)) {
      return NextResponse.json({ error: 'Short URL kustom tidak tersedia.' }, { status: 400 })
    }

    // Check if new short URL is taken
    const existingResult = await db.query(
      'SELECT id FROM "Link" WHERE "shortUrl" = $1',
      [shortUrl]
    )

    if (existingResult.rows.length > 0 && existingResult.rows[0].id !== id) {
      return NextResponse.json({ error: 'Short URL kustom sudah digunakan.' }, { status: 400 })
    }

    updateFields.push(`"shortUrl" = $${paramIndex}`)
    queryParams.push(shortUrl)
    paramIndex++

    updateFields.push(`custom = true`)
    updateFields.push(`"customChanges" = $${paramIndex}`)
    queryParams.push(link.customChanges + 1)
    paramIndex++
  }

  if (updateFields.length === 0) {
    return NextResponse.json({ error: 'Tidak ada data untuk diperbarui.' }, { status: 400 })
  }

  updateFields.push(`"updatedAt" = NOW()`)

  // Update link using raw SQL
  const updateQuery = `
    UPDATE "Link" 
    SET ${updateFields.join(', ')}
    WHERE id = $1 AND "userId" = $2
    RETURNING *
  `
  
  const updatedResult = await db.query(updateQuery, queryParams)
  const updatedLink = updatedResult.rows[0]

  return NextResponse.json(updatedLink)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Get link using raw SQL
  const linkResult = await db.query(
    'SELECT * FROM "Link" WHERE id = $1 AND "userId" = $2',
    [id, session.user.id]
  )

  if (linkResult.rows.length === 0) {
    return NextResponse.json({ error: 'Link tidak ditemukan.' }, { status: 404 })
  }

  // Delete link using raw SQL
  await db.query(
    'DELETE FROM "Link" WHERE id = $1',
    [id]
  )

  return NextResponse.json({ message: 'Link berhasil dihapus.' })
}