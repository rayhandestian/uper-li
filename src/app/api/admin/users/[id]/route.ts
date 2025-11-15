import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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

  const updateFields: string[] = []
  const updateValues: any[] = []
  let paramCount = 0

  if (active !== undefined) {
    paramCount++
    updateFields.push(`active = $${paramCount}`)
    updateValues.push(active)
  }

  if (role !== undefined) {
    paramCount++
    updateFields.push(`role = $${paramCount}`)
    updateValues.push(role)
  }

  if (updateFields.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  paramCount++
  updateFields.push(`"updatedAt" = NOW()`)
  updateValues.push(id)

  const query = `
    UPDATE "User"
    SET ${updateFields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING id, email, "nimOrUsername", role, "emailVerified",
              "twoFactorEnabled", "monthlyLinksCreated", "totalLinks",
              "createdAt", active
  `

  const result = await db.query(query, updateValues)

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json(result.rows[0])
}