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
  const active = searchParams.get('active')

  const offset = (page - 1) * limit

  // Build WHERE clause for Prisma
  const where = {} as Prisma.LinkWhereInput

  if (search) {
    where.OR = [
      { shortUrl: { contains: search, mode: 'insensitive' } },
      { longUrl: { contains: search, mode: 'insensitive' } },
      { User: { nimOrUsername: { contains: search, mode: 'insensitive' } } },
      { User: { email: { contains: search, mode: 'insensitive' } } }
    ]
  }

  if (active !== null && active !== undefined) {
    where.active = active === 'true'
  }

  // Get total count
  const total = await prisma.link.count({ where })

  // Get paginated links with user info
  const links = await prisma.link.findMany({
    where,
    include: {
      User: {
        select: {
          nimOrUsername: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  })

  const totalPages = Math.ceil(total / limit)

  // Log audit action
  await logAdminAction({
    adminId: admin.id,
    action: AUDIT_ACTIONS.LINK_VIEW,
    details: { page, limit, search, active },
    req: request
  })

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