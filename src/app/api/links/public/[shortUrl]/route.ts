import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

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

  logger.info('Query result:', { count: linkResult.rows.length })

  if (linkResult.rows.length === 0) {
    logger.info('No link found for shortUrl:', { shortUrl })
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