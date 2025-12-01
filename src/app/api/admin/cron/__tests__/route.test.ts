/**
 * @jest-environment node
 */
import { POST } from '../route'
import { NextRequest } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { manualMonthlyReset } from '@/lib/cron'

// Mock dependencies
jest.mock('next/headers', () => ({
    cookies: () => ({
        get: () => ({ value: 'valid-token' }),
    }),
}))

jest.mock('@/lib/admin-auth', () => ({
    validateAdminSession: jest.fn(),
    extendSessionActivity: jest.fn(),
    cleanupExpiredSessions: jest.fn(),
}))

jest.mock('@/lib/cron', () => ({
    manualMonthlyReset: jest.fn(),
    manualLinkCleanup: jest.fn(),
    deleteUnverifiedUsers: jest.fn(),
}))

jest.mock('@/lib/rateLimit', () => ({
    cleanupExpiredRateLimits: jest.fn(),
}))

jest.mock('@/lib/verificationAttempts', () => ({
    cleanupExpiredLockouts: jest.fn(),
}))

jest.mock('@/lib/admin-audit', () => ({
    logAdminAction: jest.fn(),
    AUDIT_ACTIONS: { CRON_MANUAL_TRIGGER: 'CRON_MANUAL_TRIGGER' },
}))

jest.mock('@/lib/logger', () => ({
    logger: { error: jest.fn() },
}))

describe('Cron API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('returns 401 if unauthorized', async () => {
        (validateAdminSession as jest.Mock).mockResolvedValue(null)

        const req = new NextRequest('http://localhost/api/admin/cron', {
            method: 'POST',
            body: JSON.stringify({ action: 'monthly_reset' }),
        })

        const res = await POST(req)
        expect(res.status).toBe(401)
    })

    it('executes monthly_reset action', async () => {
        ; (validateAdminSession as jest.Mock).mockResolvedValue({ id: 'admin1' })
            ; (manualMonthlyReset as jest.Mock).mockResolvedValue({ success: true })

        const req = new NextRequest('http://localhost/api/admin/cron', {
            method: 'POST',
            body: JSON.stringify({ action: 'monthly_reset' }),
        })

        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.success).toBe(true)
        expect(manualMonthlyReset).toHaveBeenCalled()
    })

    it('handles invalid action', async () => {
        (validateAdminSession as jest.Mock).mockResolvedValue({ id: 'admin1' })

        const req = new NextRequest('http://localhost/api/admin/cron', {
            method: 'POST',
            body: JSON.stringify({ action: 'invalid_action' }),
        })

        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it('handles errors', async () => {
        ; (validateAdminSession as jest.Mock).mockResolvedValue({ id: 'admin1' })
            ; (manualMonthlyReset as jest.Mock).mockRejectedValue(new Error('Cron failed'))

        const req = new NextRequest('http://localhost/api/admin/cron', {
            method: 'POST',
            body: JSON.stringify({ action: 'monthly_reset' }),
        })

        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error).toBe('Cron failed')
    })
})
