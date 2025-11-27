import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { validateAdminSession, extendSessionActivity } from '@/lib/admin-auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/admin-audit'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('admin_session')?.value

  // Validate admin session
  const admin = await validateAdminSession(sessionToken)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Extend session activity
  await extendSessionActivity(sessionToken!)

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
      User: {
        select: {
          nimOrUsername: true,
          email: true
        }
      }
    }
  })

  // Log audit action
  await logAdminAction({
    adminId: admin.id,
    action: AUDIT_ACTIONS.LINK_VIEW, // Note: Using LINK_VIEW as placeholder, should be LINK_UPDATE in constants
    resource: id,
    details: { active },
    req: request
  })

  return NextResponse.json(link)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('admin_session')?.value

  // Validate admin session
  const admin = await validateAdminSession(sessionToken)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Extend session activity
  await extendSessionActivity(sessionToken!)

  const { id } = await params

  // Delete link using Prisma
  await prisma.link.delete({
    where: { id }
  })

  // Log audit action
  await logAdminAction({
    adminId: admin.id,
    action: AUDIT_ACTIONS.LINK_DELETE,
    resource: id,
    req: request
  })

  return NextResponse.json({ message: 'Link berhasil dihapus.' })
}