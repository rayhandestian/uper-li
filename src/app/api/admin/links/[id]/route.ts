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

  const { active } = await request.json()
  const { id } = await params

  if (active === undefined) {
    return NextResponse.json({ error: 'Active field is required' }, { status: 400 })
  }

  const updateQuery = `
    UPDATE "Link"
    SET active = $1, "updatedAt" = NOW()
    WHERE id = $2
    RETURNING *,
           (SELECT "nimOrUsername" FROM "User" WHERE id = "userId") as user_nimOrUsername,
           (SELECT email FROM "User" WHERE id = "userId") as user_email
  `

  const result = await db.query(updateQuery, [active, id])

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  }

  const link = result.rows[0]
  
  // Format response to match expected structure
  const formattedLink = {
    ...link,
    user: {
      nimOrUsername: link.user_nimorusername,
      email: link.user_email
    }
  }
  
  // Remove temporary fields
  delete formattedLink.user_nimorusername
  delete formattedLink.user_email

  return NextResponse.json(formattedLink)
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

  const deleteQuery = 'DELETE FROM "Link" WHERE id = $1'
  const result = await db.query(deleteQuery, [id])

  if (result.rowCount === 0) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  }

  return NextResponse.json({ message: 'Link berhasil dihapus.' })
}