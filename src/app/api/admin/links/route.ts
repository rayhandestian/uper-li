import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const active = searchParams.get('active')

  const offset = (page - 1) * limit

  // Build WHERE clause
  const whereConditions = []
  const queryParams: any[] = []
  let paramCount = 0

  if (search) {
    paramCount++
    whereConditions.push(`(
      l."shortUrl" ILIKE $${paramCount} OR
      l."longUrl" ILIKE $${paramCount} OR
      u."nimOrUsername" ILIKE $${paramCount} OR
      u.email ILIKE $${paramCount}
    )`)
    queryParams.push(`%${search}%`)
  }

  if (active !== null && active !== undefined) {
    paramCount++
    whereConditions.push(`l.active = $${paramCount}`)
    queryParams.push(active === 'true')
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM "Link" l
    JOIN "User" u ON l."userId" = u.id
    ${whereClause}
  `

  const countResult = await db.query(countQuery, queryParams)
  const total = parseInt(countResult.rows[0].total)

  // Get paginated links
  const linksQuery = `
    SELECT l.*, u."nimOrUsername", u.email
    FROM "Link" l
    JOIN "User" u ON l."userId" = u.id
    ${whereClause}
    ORDER BY l."createdAt" DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `

  queryParams.push(limit, offset)
  const linksResult = await db.query(linksQuery, queryParams)
  const links = linksResult.rows

  const totalPages = Math.ceil(total / limit)

  return NextResponse.json({
    links,
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