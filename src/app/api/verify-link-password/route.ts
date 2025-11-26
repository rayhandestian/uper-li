import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'
import { withRateLimit } from '@/lib/rateLimit'

async function handleVerifyLinkPassword(request: NextRequest) {
  try {
    const { shortUrl, password } = await request.json()

    if (!shortUrl || !password) {
      return NextResponse.json({ error: 'Short URL dan password diperlukan.' }, { status: 400 })
    }

    // Get link using Prisma
    const link = await prisma.link.findUnique({
      where: { shortUrl },
      select: {
        id: true,
        password: true
      }
    })

    if (!link) {
      return NextResponse.json({ error: 'Link tidak ditemukan.' }, { status: 404 })
    }

    if (!link.password) {
      return NextResponse.json({ error: 'Link ini tidak memerlukan password.' }, { status: 400 })
    }

    const isValidPassword = await bcrypt.compare(password, link.password)

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Password salah.' }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Password verification error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

export const POST = withRateLimit(handleVerifyLinkPassword, { limit: 5, windowMs: 10 * 60 * 1000 }) // 5 attempts per 10 minutes