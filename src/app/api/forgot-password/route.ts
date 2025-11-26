import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { getResetPasswordEmailHtml } from '@/lib/email-templates'
import { withRateLimit } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

async function handleForgotPassword(request: NextRequest) {
    try {
        const { nimOrUsername, turnstileToken } = await request.json()

        if (!nimOrUsername) {
            return NextResponse.json({ error: 'NIM/Username diperlukan.' }, { status: 400 })
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
            return NextResponse.json({ error: 'Verifikasi CAPTCHA gagal.' }, { status: 400 })
        }

        // Find user by nimOrUsername using Prisma
        const user = await prisma.user.findUnique({
            where: { nimOrUsername },
            select: { id: true, email: true, emailVerified: true }
        })

        // Always return success to prevent enumeration, but only send email if user exists and is verified
        if (user) {
            // Check if user email is verified
            if (!user.emailVerified) {
                // Return success message to prevent enumeration, but don't send email
                return NextResponse.json({ message: 'Jika akun ditemukan, kode verifikasi telah dikirim ke email Anda.' })
            }

            // Generate 6-digit verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

            // Set expiration to 10 minutes from now
            const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000)

            // Update user with verification token using Prisma
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    verificationToken: verificationCode,
                    verificationTokenExpires,
                    updatedAt: new Date()
                }
            })

            // Send email
            await sendEmail({
                to: user.email,
                from: 'noreply@uper.li',
                subject: 'Reset Password UPer.li',
                html: getResetPasswordEmailHtml(verificationCode),
            })
        }

        return NextResponse.json({ message: 'Jika akun ditemukan, kode verifikasi telah dikirim ke email Anda.' })
    } catch (error) {
        logger.error('Forgot password error:', error)
        return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
    }
}

export const POST = withRateLimit(handleForgotPassword, { limit: 5, windowMs: 15 * 60 * 1000 }) // 5 attempts per 15 minutes
