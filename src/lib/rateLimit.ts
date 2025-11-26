import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'
import { logger } from './logger'

interface RateLimitResult {
  allowed: boolean
  resetTime?: number
  remaining?: number
}

/**
 * Check rate limit using database storage
 * @param identifier - IP address or user ID
 * @param endpoint - API endpoint being accessed
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000
): Promise<RateLimitResult> {
  try {
    const now = new Date()
    const resetTime = new Date(Date.now() + windowMs)

    // Try to find existing rate limit entry
    const entry = await prisma.rateLimit.findUnique({
      where: {
        identifier_endpoint: {
          identifier,
          endpoint
        }
      }
    })

    // If no entry or window expired, create/reset
    if (!entry || new Date(entry.resetTime) < now) {
      await prisma.rateLimit.upsert({
        where: {
          identifier_endpoint: {
            identifier,
            endpoint
          }
        },
        create: {
          identifier,
          endpoint,
          count: 1,
          resetTime
        },
        update: {
          count: 1,
          resetTime,
          updatedAt: now
        }
      })

      return { allowed: true, remaining: limit - 1 }
    }

    // Check if limit exceeded
    if (entry.count >= limit) {
      return {
        allowed: false,
        resetTime: entry.resetTime.getTime(),
        remaining: 0
      }
    }

    // Increment count
    await prisma.rateLimit.update({
      where: {
        identifier_endpoint: {
          identifier,
          endpoint
        }
      },
      data: {
        count: { increment: 1 },
        updatedAt: now
      }
    })

    return {
      allowed: true,
      remaining: limit - entry.count - 1,
      resetTime: entry.resetTime.getTime()
    }
  } catch (error) {
    logger.error('Rate limit check error:', error)
    // Fail open: allow request if database is down
    // This prevents DoS of the service itself
    return { allowed: true, remaining: 0 }
  }
}

/**
 * Cleanup expired rate limit entries
 * Should be called periodically (e.g., via cron job)
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  try {
    const result = await prisma.rateLimit.deleteMany({
      where: {
        resetTime: {
          lt: new Date()
        }
      }
    })

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired rate limit entries`)
    }
    return result.count
  } catch (error) {
    logger.error('Rate limit cleanup error:', error)
    return 0
  }
}

/**
 * Wrapper to apply rate limiting to API route handlers
 */
export function withRateLimit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse> | NextResponse,
  options: { limit?: number; windowMs?: number; endpoint?: string } = {}
) {
  const { limit = 5, windowMs = 15 * 60 * 1000, endpoint } = options

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextRequest, ...args: any[]) => {
    // Get client IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') ||
      'unknown'

    // Use endpoint from options or infer from request URL
    const endpointId = endpoint || req.nextUrl.pathname

    const result = await checkRateLimit(ip, endpointId, limit, windowMs)

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
      response.headers.set('X-RateLimit-Remaining', (result.remaining ?? 0).toString())
      if (result.resetTime) {
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
      }
    }

    return response
  }
}