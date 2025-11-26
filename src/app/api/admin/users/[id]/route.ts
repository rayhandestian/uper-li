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

  const { active, role } = await request.json()
  const { id } = await params

  const updateData: {
    active?: boolean
    role?: string
    updatedAt: Date
  } = {
    updatedAt: new Date()
  }

  if (active !== undefined) {
    updateData.active = active
  }

  if (role !== undefined) {
    updateData.role = role
  }

  if (Object.keys(updateData).length === 1) { // Only updatedAt
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  try {
    // Update user using Prisma
    const user = await prisma.user.update({
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
        active: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    // Prisma error code for record not found
    if ((error as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    throw error
  }
}