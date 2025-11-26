import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortUrl: string }> }
) {
  const { shortUrl } = await params

  // Get link using Prisma
  const link = await prisma.link.findUnique({
    where: { shortUrl }
  })

  logger.info('Query result:', { found: !!link })

  if (!link) {
    logger.info('No link found for shortUrl:', { shortUrl })
    return NextResponse.json({ status: 'not_found' })
  }

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