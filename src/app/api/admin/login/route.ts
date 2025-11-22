import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { withRateLimit } from '@/lib/rateLimit'
import crypto from 'crypto'
import { signAdminToken } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'

async function handleAdminLogin(request: NextRequest) {
  try {
    const { passcode, turnstileToken } = await request.json()

    if (!passcode) {
      return NextResponse.json({ error: 'Passcode is required' }, { status: 400 })
    }

    // Validate Turnstile
    const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.CLOUDFLARE_TURNSTILE_SECRET!,
        response: turnstileToken,
      }),
    })

    const turnstileData = await turnstileResponse.json()
    if (!turnstileData.success) {
      return NextResponse.json({ error: 'CAPTCHA verification failed.' }, { status: 400 })
    }

    const adminPasscode = process.env.ADMIN_PASSCODE
    if (!adminPasscode) {
      return NextResponse.json({ error: 'Admin passcode not configured' }, { status: 500 })
    }

    // Secure string comparison
    const encoder = new TextEncoder()
    const a = encoder.encode(passcode)
    const b = encoder.encode(adminPasscode)

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 })
    }

    // Set signed cookie for admin auth
    const token = signAdminToken()
    const cookieStore = await cookies()
    cookieStore.set('admin_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Admin login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withRateLimit(handleAdminLogin, { limit: 3, windowMs: 60 * 60 * 1000 }) // 3 attempts per hour