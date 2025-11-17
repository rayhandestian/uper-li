import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { checkUrlSafety } from '@/lib/safeBrowsing'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''
  const active = searchParams.get('active')
  const sort = searchParams.get('sort') || 'createdAt'
  const order = searchParams.get('order') || 'desc'

  const skip = (page - 1) * limit

  // Build WHERE clause
  let whereConditions = ['"userId" = $1']
  let params: any[] = [session.user.id]
  let paramIndex = 2

  if (search) {
    whereConditions.push(`("shortUrl" ILIKE $${paramIndex} OR "longUrl" ILIKE $${paramIndex})`)
    params.push(`%${search}%`)
    paramIndex++
  }

  if (active !== null && active !== undefined) {
    whereConditions.push(`active = $${paramIndex}`)
    params.push(active === 'true')
    paramIndex++
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`

  // Build ORDER BY
  const validSortFields = ['createdAt', 'updatedAt', 'shortUrl', 'visitCount', 'lastVisited']
  const sortField = validSortFields.includes(sort) ? sort : 'createdAt'
  const orderDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC'

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM "Link" ${whereClause}`
  const countResult = await db.query(countQuery, params)
  const total = parseInt(countResult.rows[0].total)

  // Get paginated links
  const linksQuery = `
    SELECT *, (password IS NOT NULL) as "hasPassword" FROM "Link"
    ${whereClause}
    ORDER BY "${sortField}" ${orderDirection}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  
  params.push(limit, skip)
  const linksResult = await db.query(linksQuery, params)

  const totalPages = Math.ceil(total / limit)

  return NextResponse.json({
    links: linksResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { longUrl, customUrl, password } = await request.json()

  if (!longUrl) {
    return NextResponse.json({ error: 'URL asli diperlukan.' }, { status: 400 })
  }

  // Validate URL format
  try {
    new URL(longUrl)
  } catch {
    return NextResponse.json({ error: 'URL tidak valid.' }, { status: 400 })
  }

  // Check URL length
  if (longUrl.length > 2048) {
    return NextResponse.json({ error: 'URL terlalu panjang (max 2048 karakter).' }, { status: 400 })
  }

  // Check safety
  const isSafe = await checkUrlSafety(longUrl)
  if (!isSafe) {
    return NextResponse.json({ error: 'URL terdeteksi berbahaya.' }, { status: 400 })
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

  // Check limits
  const maxMonthly = user.role === 'STUDENT' ? 5 : 10
  const maxTotal = user.role === 'STUDENT' ? 100 : 200

  if (user.monthlyLinksCreated >= maxMonthly) {
    return NextResponse.json({ error: 'Batas link bulanan tercapai.' }, { status: 400 })
  }

  if (user.totalLinks >= maxTotal) {
    return NextResponse.json({ error: 'Batas total link tercapai.' }, { status: 400 })
  }

  let shortUrl = customUrl

  if (customUrl) {
    // Validate custom URL
    if (customUrl.length > 255 || !/^[a-zA-Z0-9-_]+$/.test(customUrl)) {
      return NextResponse.json({ error: 'Short URL kustom tidak valid.' }, { status: 400 })
    }

    // Check if custom URL is taken
    const existingResult = await db.query(
      'SELECT id FROM "Link" WHERE "shortUrl" = $1',
      [customUrl]
    )

    if (existingResult.rows.length > 0) {
      return NextResponse.json({ error: 'Short URL kustom sudah digunakan.' }, { status: 400 })
    }
  } else {
    // Generate random short URL
    let attempts = 0
    do {
      shortUrl = crypto.randomBytes(3).toString('hex') // 6 characters
      attempts++
      if (attempts > 10) {
        return NextResponse.json({ error: 'Gagal menghasilkan short URL.' }, { status: 500 })
      }
      
      const existingResult = await db.query(
        'SELECT id FROM "Link" WHERE "shortUrl" = $1',
        [shortUrl]
      )
      
      if (existingResult.rows.length === 0) break
    } while (true)
  }

  // Hash password if provided
  let hashedPassword = null
  if (password) {
    if (password.length < 4) {
      return NextResponse.json({ error: 'Password minimal 4 karakter.' }, { status: 400 })
    }
    hashedPassword = await bcrypt.hash(password, 12)
  }

  // Create link using raw SQL
  const linkResult = await db.query(
    `INSERT INTO "Link" (
      id, "shortUrl", "longUrl", "userId", custom, password, "createdAt", "updatedAt"
    ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()) 
    RETURNING *`,
    [shortUrl, longUrl, session.user.id, !!customUrl, hashedPassword]
  )

  const link = linkResult.rows[0]

  // Update user counters using raw SQL
  await db.query(
    `UPDATE "User" 
     SET "monthlyLinksCreated" = "monthlyLinksCreated" + 1, "totalLinks" = "totalLinks" + 1, "updatedAt" = NOW()
     WHERE id = $1`,
    [session.user.id]
  )

  return NextResponse.json(link)
}