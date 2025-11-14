import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role')

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}

  if (search) {
    where.OR = [
      { nimOrUsername: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (role && role !== 'all') {
    where.role = role
  }

  // Get total count for pagination
  const total = await prisma.user.count({ where })

  // Get paginated users
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
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
      active: true,
    },
  })

  const totalPages = Math.ceil(total / limit)

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