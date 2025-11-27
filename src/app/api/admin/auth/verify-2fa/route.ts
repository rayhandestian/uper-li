import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rateLimit'
import { prisma } from '@/lib/prisma'
import { createAdminSession } from '@/lib/admin-auth'
import { recordFailedAttempt, recordSuccessfulAttempt, isAccountLocked } from '@/lib/admin-verification'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/admin-audit'
import { logger } from '@/lib/logger'

async function handleVerify2FA(request: NextRequest) {
    try {
        const { email, code } = await request.json()

        if (!email || !code) {
            return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
        }

        // Find admin by email
        const admin = await prisma.admin.findUnique({
            where: { email: email.toLowerCase() }
        })

        if (!admin) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        // Check if account is locked for 2FA attempts
        const lockStatus = await isAccountLocked(admin.id, '2fa')
        if (lockStatus.locked) {
            await logAdminAction({
                adminId: admin.id,
                action: AUDIT_ACTIONS.LOGIN_LOCKED,
                details: { attemptType: '2fa', lockoutEndsAt: lockStatus.lockoutEndsAt },
                success: false,
                req: request
            })

            const remainingMinutes = lockStatus.lockoutEndsAt
                ? Math.ceil((lockStatus.lockoutEndsAt.getTime() - Date.now()) / (1000 * 60))
                : 30

            return NextResponse.json({
                error: `Too many failed 2FA attempts. Try again in ${remainingMinutes} minutes.`
            }, { status: 429 })
        }

        // Check if 2FA code exists and hasn't expired
        if (!admin.twoFactorSecret) {
            return NextResponse.json({ error: 'No 2FA code found. Please login again.' }, { status: 400 })
        }

        // Check if code has expired (stored in updatedAt field)
        const codeExpiresAt = admin.updatedAt
        if (!codeExpiresAt || new Date() > codeExpiresAt) {
            await prisma.admin.update({
                where: { id: admin.id },
                data: { twoFactorSecret: null }
            })

            return NextResponse.json({ error: '2FA code has expired. Please login again.' }, { status: 400 })
        }

        // Verify code
        if (admin.twoFactorSecret !== code) {
            // Record failed 2FA attempt
            await recordFailedAttempt(admin.id, '2fa')

            await logAdminAction({
                adminId: admin.id,
                action: AUDIT_ACTIONS.LOGIN_FAILED,
                details: { reason: 'invalid_2fa_code' },
                success: false,
                req: request
            })

            return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 })
        }

        // Clear 2FA attempts on success
        await recordSuccessfulAttempt(admin.id, '2fa')

        // Clear 2FA secret
        await prisma.admin.update({
            where: { id: admin.id },
            data: { twoFactorSecret: null }
        })

        // Create session
        const { session, token } = await createAdminSession(admin.id, request)

        // Set session cookie
        const response = NextResponse.json({ success: true })
        response.cookies.set('admin_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 12 * 60 * 60, // 12 hours
            path: '/',
        })

        await logAdminAction({
            adminId: admin.id,
            action: AUDIT_ACTIONS.LOGIN_SUCCESS,
            details: { sessionId: session.id, via2FA: true },
            req: request
        })

        return response
    } catch (error) {
        logger.error('Admin 2FA verification error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export const POST = withRateLimit(handleVerify2FA, { limit: 5, windowMs: 10 * 60 * 1000 }) // 5 attempts per 10 minutes
