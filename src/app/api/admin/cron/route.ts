import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { manualMonthlyReset, manualLinkCleanup } from '@/lib/cron'
import { cleanupExpiredRateLimits } from '@/lib/rateLimit'
import { cleanupExpiredLockouts } from '@/lib/verificationAttempts'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')

  if (!adminAuth || adminAuth.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { action } = await request.json()

  try {
    switch (action) {
      case 'monthly_reset':
        const resetResult = await manualMonthlyReset()
        return NextResponse.json(resetResult)

      case 'link_cleanup':
        const cleanupResult = await manualLinkCleanup()
        return NextResponse.json(cleanupResult)

      case 'rate_limit_cleanup':
        const deletedCount = await cleanupExpiredRateLimits()
        return NextResponse.json({
          success: true,
          deletedCount,
          message: `Cleaned up ${deletedCount} expired rate limit entries`
        })

      case 'verification_attempt_cleanup':
        const attemptCount = await cleanupExpiredLockouts()
        return NextResponse.json({
          success: true,
          deletedCount: attemptCount,
          message: `Cleaned up ${attemptCount} expired verification attempt lockouts`
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    logger.error('Cron job error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}