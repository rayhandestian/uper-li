import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const { linkId } = await request.json()

  if (!linkId) {
    return NextResponse.json({ error: 'Link ID required' }, { status: 400 })
  }

  // Update visit count using raw SQL
  await db.query(
    'UPDATE "Link" SET "visitCount" = "visitCount" + 1, "lastVisited" = NOW() WHERE id = $1',
    [linkId]
  )

  return NextResponse.json({ success: true })
}