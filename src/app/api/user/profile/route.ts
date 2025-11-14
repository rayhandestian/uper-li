import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      nimOrUsername: true,
      emailVerified: true,
      monthlyLinksCreated: true,
      totalLinks: true,
      twoFactorEnabled: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
  }

  return NextResponse.json(user)
}