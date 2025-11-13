import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { active } = await request.json()
  const { id } = await params

  const link = await prisma.link.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  })

  if (!link) {
    return NextResponse.json({ error: 'Link tidak ditemukan.' }, { status: 404 })
  }

  const updatedLink = await prisma.link.update({
    where: { id },
    data: { active },
  })

  return NextResponse.json(updatedLink)
}