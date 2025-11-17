import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')

  if (!adminAuth || adminAuth.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role')

  const skip = (page - 1) * limit

  // Build WHERE clause
  const whereConditions = []
  const params: unknown[] = []
  let paramIndex = 1

  if (search) {
    whereConditions.push(`("nimOrUsername" ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`)
    params.push(`%${search}%`)
    paramIndex++
  }

  if (role && role !== 'all') {
    whereConditions.push(`role = $${paramIndex}`)
    params.push(role)
    paramIndex++
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM "User" ${whereClause}`
  const countResult = await db.query(countQuery, params)
  const total = parseInt(countResult.rows[0].total)

  // Get paginated users
  const usersQuery = `
    SELECT id, email, "nimOrUsername", role, "emailVerified", "twoFactorEnabled", 
           "monthlyLinksCreated", "totalLinks", "createdAt", active
    FROM "User" 
    ${whereClause}
    ORDER BY "createdAt" DESC 
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  
  params.push(limit, skip)
  const usersResult = await db.query(usersQuery, params)

  const totalPages = Math.ceil(total / limit)

  return NextResponse.json({
    users: usersResult.rows,
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