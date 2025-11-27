import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { validateAdminSession, extendSessionActivity } from '@/lib/admin-auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/admin-audit'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('admin_session')?.value

  // Validate admin session
  const admin = await validateAdminSession(sessionToken)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Extend session activity
  await extendSessionActivity(sessionToken!)

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role')

  const skip = (page - 1) * limit

  // Build WHERE clause for Prisma
  const where = {} as Prisma.UserWhereInput

  if (search) {
    where.OR = [
      { nimOrUsername: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ]
  }

  if (role && role !== 'all') {
    where.role = role
  }

  // Get total count
  const total = await prisma.user.count({ where })

  // Get paginated users
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      nimOrUsername: true,
      role: true,
      emailVerified: true,
      twoFactorEnabled: true,
      monthlyLinksCreated: true,
      totalLinks: true,
      createdAt: true,
      active: true
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip
  })

  const totalPages = Math.ceil(total / limit)

  // Log audit action
  await logAdminAction({
    adminId: admin.id,
    action: AUDIT_ACTIONS.USER_VIEW,
    details: { page, limit, search, role },
    req: request
  })

  return NextResponse.json({
    users,
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