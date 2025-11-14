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
  const active = searchParams.get('active')

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}

  if (search) {
    where.OR = [
      { shortUrl: { contains: search, mode: 'insensitive' } },
      { longUrl: { contains: search, mode: 'insensitive' } },
      { user: { nimOrUsername: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ]
  }

  if (active !== null && active !== undefined) {
    where.active = active === 'true'
  }

  // Get total count for pagination
  const total = await prisma.link.count({
    where: {
      ...where,
      user: where.user || undefined,
    }
  })

  // Get paginated links
  const links = await prisma.link.findMany({
    where: {
      ...where,
      user: where.user || undefined,
    },
    include: {
      user: {
        select: {
          nimOrUsername: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  })

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