import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/admin-auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')

  if (!adminAuth || !verifyAdminToken(adminAuth.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { active } = await request.json()
  const { id } = await params

  if (active === undefined) {
    return NextResponse.json({ error: 'Active field is required' }, { status: 400 })
  }

  // Update link and include user info using Prisma
  const link = await prisma.link.update({
    where: { id },
    data: {
      active,
      updatedAt: new Date()
    },
    include: {
      user: {
        select: {
          nimOrUsername: true,
          email: true
        }
      }
    }
  })

  return NextResponse.json(link)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')

  if (!adminAuth || !verifyAdminToken(adminAuth.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params

  // Delete link using Prisma
  await prisma.link.delete({
    where: { id }
  })

  return NextResponse.json({ message: 'Link berhasil dihapus.' })
}