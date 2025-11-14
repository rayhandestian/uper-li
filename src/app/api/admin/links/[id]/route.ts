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

  const { active } = await request.json()
  const { id } = await params

  const updateData: any = {}

  if (active !== undefined) {
    updateData.active = active
  }

  const updatedLink = await prisma.link.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          nimOrUsername: true,
          email: true,
        },
      },
    },
  })

  return NextResponse.json(updatedLink)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params

  await prisma.link.delete({
    where: { id },
  })

  return NextResponse.json({ message: 'Link berhasil dihapus.' })
}