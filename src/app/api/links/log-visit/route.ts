import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { linkId } = await request.json()

  if (!linkId) {
    return NextResponse.json({ error: 'Link ID required' }, { status: 400 })
  }

  // Update visit count using Prisma
  await prisma.link.update({
    where: { id: linkId },
    data: {
      visitCount: { increment: 1 },
      lastVisited: new Date()
    }
  })

  return NextResponse.json({ success: true })
}