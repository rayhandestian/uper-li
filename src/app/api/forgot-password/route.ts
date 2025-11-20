import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { withRateLimit } from '@/lib/rateLimit'

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

        // Find user by nimOrUsername
        const userResult = await db.query(
            'SELECT id, email FROM "User" WHERE "nimOrUsername" = $1',
            [nimOrUsername]
        )

        // Always return success to prevent enumeration, but only send email if user exists
        if (userResult.rows.length > 0) {
            const user = userResult.rows[0]

            // Generate 6-digit verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

            // Set expiration to 10 minutes from now
            // Using raw SQL interval for reliability or JS Date object
            // Let's use JS Date object as in register route
            const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000)

            // Update user with verification token
            await db.query(
                `UPDATE "User" 
         SET "verificationToken" = $1, "verificationTokenExpires" = $2, "updatedAt" = NOW()
         WHERE id = $3`,
                [verificationCode, verificationTokenExpires, user.id]
            )

            // Send email
            await sendEmail({
                to: user.email,
                from: 'noreply@uper.li',
                subject: 'Reset Password UPer.li',
                html: `
          <p>Halo,</p>
          <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
          <p>Gunakan kode berikut untuk melanjutkan proses reset password:</p>
          <p style="font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0;">${verificationCode}</p>
          <p>Kode ini akan kadaluarsa dalam 10 menit.</p>
          <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
        `,
            })
        }

        return NextResponse.json({ message: 'Jika akun ditemukan, kode verifikasi telah dikirim ke email Anda.' })
    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
    }
}

export const POST = withRateLimit(handleForgotPassword, { limit: 3, windowMs: 15 * 60 * 1000 }) // 3 attempts per 15 minutes
