import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortUrl: string }> }
) {
  const { shortUrl } = await params

  // Get link using raw SQL
  const linkResult = await db.query(
    'SELECT * FROM "Link" WHERE "shortUrl" = $1',
    [shortUrl]
  )

  console.log('Query result:', linkResult.rows.length, 'rows found')

  if (linkResult.rows.length === 0) {
    console.log('No link found for shortUrl:', shortUrl)
    return NextResponse.json({ status: 'not_found' })
  }

  const link = linkResult.rows[0]

  if (!link.active) {
    return NextResponse.json({ status: 'inactive' })
  }

  if (link.password) {
    return NextResponse.json({ status: 'locked', longUrl: link.longUrl })
  }

  return NextResponse.json({
    status: 'ok',
    longUrl: link.longUrl,
    mode: link.mode,
    id: link.id
  })
}