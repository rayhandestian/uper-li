import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rateLimit'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { createAdminSession } from '@/lib/admin-auth'
import { recordFailedAttempt, recordSuccessfulAttempt, isAccountLocked } from '@/lib/admin-verification'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/admin-audit'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

async function handleAdminLogin(request: NextRequest) {
    try {
        const { email, password, turnstileToken } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        // Validate Turnstile CAPTCHA
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

        // Find admin by email
        const admin = await prisma.admin.findUnique({
            where: { email: email.toLowerCase() }
        })

        if (!admin) {
            // Don't reveal that the admin doesn't exist
            await logAdminAction({
                action: AUDIT_ACTIONS.LOGIN_FAILED,
                details: { email, reason: 'admin_not_found' },
                success: false,
                req: request
            })
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Check if account is active
        if (!admin.active) {
            await logAdminAction({
                adminId: admin.id,
                action: AUDIT_ACTIONS.LOGIN_FAILED,
                details: { reason: 'account_inactive' },
                success: false,
                req: request
            })
            return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
        }

        // Check if account is locked
        const lockStatus = await isAccountLocked(admin.id, 'login')
        if (lockStatus.locked) {
            await logAdminAction({
                adminId: admin.id,
                action: AUDIT_ACTIONS.LOGIN_LOCKED,
                details: { lockoutEndsAt: lockStatus.lockoutEndsAt },
                success: false,
                req: request
            })

            const remainingMinutes = lockStatus.lockoutEndsAt
                ? Math.ceil((lockStatus.lockoutEndsAt.getTime() - Date.now()) / (1000 * 60))
                : 15

            return NextResponse.json({
                error: `Account locked due to too many failed login attempts. Try again in ${remainingMinutes} minutes.`
            }, { status: 429 })
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password)
        if (!isValidPassword) {
            // Record failed attempt
            await recordFailedAttempt(admin.id, 'login')

            await logAdminAction({
                adminId: admin.id,
                action: AUDIT_ACTIONS.LOGIN_FAILED,
                details: { reason: 'invalid_password' },
                success: false,
                req: request
            })

            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Clear login attempts on successful password verification
        await recordSuccessfulAttempt(admin.id, 'login')

        // Check if 2FA is enabled
        if (admin.twoFactorEnabled) {
            // Generate 6-digit 2FA code using cryptographically secure random
            const code = crypto.randomInt(100000, 1000000).toString()
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

            // Store 2FA code
            await prisma.admin.update({
                where: { id: admin.id },
                data: {
                    twoFactorSecret: code,
                    updatedAt: expiresAt // Use updatedAt to track code expiry
                }
            })

            // Send 2FA code via email
            try {
                await sendEmail({
                    to: admin.email,
                    from: process.env.SMTP_FROM || 'noreply@uper.li',
                    subject: 'Admin Login - Two-Factor Authentication Code',
                    html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
              <h2>Two-Factor Authentication Code</h2>
              <p>Hello ${admin.name},</p>
              <p>Your two-factor authentication code is:</p>
              <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                ${code}
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you did not attempt to log in, please ignore this email or contact support if you're concerned about your account security.</p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Login attempt from: ${request.headers.get('x-forwarded-for') || 'unknown IP'}<br>
                Time: ${new Date().toLocaleString()}
              </p>
            </div>
          `
                })
            } catch (error) {
                logger.error('Failed to send 2FA email:', error)
                return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 })
            }

            return NextResponse.json({
                requires2FA: true,
                email: admin.email
            })
        }

        // No 2FA required, create session immediately
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
            details: { sessionId: session.id },
            req: request
        })

        return response
    } catch (error) {
        logger.error('Admin login error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export const POST = withRateLimit(handleAdminLogin, { limit: 5, windowMs: 15 * 60 * 1000 }) // 5 attempts per 15 minutes
