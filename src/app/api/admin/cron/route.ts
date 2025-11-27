import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { manualMonthlyReset, manualLinkCleanup } from '@/lib/cron'
import { cleanupExpiredRateLimits } from '@/lib/rateLimit'
import { cleanupExpiredLockouts } from '@/lib/verificationAttempts'
import { cleanupExpiredSessions } from '@/lib/admin-auth'
import { validateAdminSession, extendSessionActivity } from '@/lib/admin-auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/admin-audit'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('admin_session')?.value

  // Validate admin session
  const admin = await validateAdminSession(sessionToken)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Extend session activity
  await extendSessionActivity(sessionToken!)

  const { action } = await request.json()

  try {
    let result
    switch (action) {
      case 'monthly_reset':
        result = await manualMonthlyReset()
        break

      case 'link_cleanup':
        result = await manualLinkCleanup()
        break

      case 'rate_limit_cleanup':
        const deletedCount = await cleanupExpiredRateLimits()
        result = {
          success: true,
          deletedCount,
          message: `Cleaned up ${deletedCount} expired rate limit entries`
        }
        break

      case 'verification_attempt_cleanup':
        const attemptCount = await cleanupExpiredLockouts()
        result = {
          success: true,
          deletedCount: attemptCount,
          message: `Cleaned up ${attemptCount} expired verification attempt lockouts`
        }
        break

      case 'admin_session_cleanup':
        const sessionCount = await cleanupExpiredSessions()
        result = {
          success: true,
          deletedCount: sessionCount,
          message: `Cleaned up ${sessionCount} expired admin sessions`
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Log audit action
    await logAdminAction({
      adminId: admin.id,
      action: AUDIT_ACTIONS.CRON_MANUAL_TRIGGER,
      details: { action, result },
      req: request
    })

    return NextResponse.json(result)
  } catch (error) {
    logger.error('Cron job error:', error)

    // Log failed action
    await logAdminAction({
      adminId: admin.id,
      action: AUDIT_ACTIONS.CRON_MANUAL_TRIGGER,
      details: { action, error: String(error) },
      success: false,
      req: request
    })

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}