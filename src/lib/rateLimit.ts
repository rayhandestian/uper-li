import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

export function checkRateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; resetTime?: number; remaining?: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { allowed: false, resetTime: entry.resetTime, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count }
}

export function withRateLimit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse> | NextResponse,
  options: { limit?: number; windowMs?: number } = {}
) {
  const { limit = 5, windowMs = 15 * 60 * 1000 } = options

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextRequest, ...args: any[]) => {
    // Get client IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') ||
      'unknown'

    const result = checkRateLimit(ip, limit, windowMs)

    if (!result.allowed) {
      const resetInSeconds = Math.ceil((result.resetTime! - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
          retryAfter: resetInSeconds
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetInSeconds.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime!.toString()
          }
        }
      )
    }

    // Add rate limit headers to successful response
    const response = await handler(req, ...args)

    if (response instanceof NextResponse) {
      response.headers.set('X-RateLimit-Remaining', result.remaining!.toString())
      response.headers.set('X-RateLimit-Reset', (Date.now() + windowMs).toString())
    }

    return response
  }
}