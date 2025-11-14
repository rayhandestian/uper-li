import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { active, role } = await request.json()
  const { id } = await params

  const updateData: any = {}

  if (active !== undefined) {
    updateData.active = active
  }

  if (role !== undefined) {
    updateData.role = role
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
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

  return NextResponse.json(updatedUser)
}