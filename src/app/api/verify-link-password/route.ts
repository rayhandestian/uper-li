import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'
import { withRateLimit } from '@/lib/rateLimit'
import { addConstantDelay } from '@/lib/timing'

async function handleVerifyLinkPassword(request: NextRequest) {
  try {
    const { shortUrl, password } = await request.json()

    if (!shortUrl || !password) {
      // Perform dummy hash to maintain timing
      await bcrypt.hash('dummy', 12)
      await addConstantDelay()
      return NextResponse.json({ error: 'Verifikasi gagal.' }, { status: 401 })
    }

    // Get link using Prisma
    const link = await prisma.link.findUnique({
      where: { shortUrl },
      select: {
        id: true,
        password: true
      }
    })

    // Always perform bcrypt comparison to maintain constant timing
    // Use dummy hash if link doesn't exist or has no password
    const storedHash = link?.password || await bcrypt.hash('dummy', 12)
    const isValidPassword = await bcrypt.compare(password, storedHash)

    // Check all conditions: link exists AND has password AND password is valid
    if (!link || !link.password || !isValidPassword) {
      await addConstantDelay()
      return NextResponse.json({ error: 'Verifikasi gagal.' }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Password verification error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

export const POST = withRateLimit(handleVerifyLinkPassword, { limit: 3, windowMs: 10 * 60 * 1000 }) // 3 attempts per 10 minutes