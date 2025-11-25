import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { sendEmail } from '@/lib/email'
import { getPasswordChangedEmailHtml } from '@/lib/email-templates'
import { logger } from '@/lib/logger'

import { withRateLimit } from '@/lib/rateLimit'

async function handleChangePassword(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { currentPassword, newPassword } = await req.json()

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Password saat ini dan password baru harus diisi' },
                { status: 400 }
            )
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: 'Password baru minimal 8 karakter' },
                { status: 400 }
            )
        }

        // Get user from database
        const userResult = await db.query(
            'SELECT * FROM "User" WHERE email = $1',
            [session.user.email]
        )

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const user = userResult.rows[0]

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password)

        if (!isValid) {
            return NextResponse.json(
                { error: 'Password saat ini salah' },
                { status: 400 }
            )
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Update password in database
        await db.query(
            'UPDATE "User" SET password = $1, "updatedAt" = NOW() WHERE id = $2',
            [hashedPassword, user.id]
        )

        // Send email notification
        try {
            await sendEmail({
                to: user.email,
                from: 'noreply@uper.li',
                subject: 'Password Berhasil Diubah - UPer.li',
                html: getPasswordChangedEmailHtml(user.name || user.nimOrUsername),
            })
        } catch (error) {
            logger.error('Failed to send password change email:', error)
            // Don't fail the request if email fails, just log it
        }

        return NextResponse.json({ message: 'Password berhasil diubah' })
    } catch (error) {
        logger.error('Change password error:', error)
        return NextResponse.json(
            { error: 'Terjadi kesalahan saat mengubah password' },
            { status: 500 }
        )
    }
}

export const POST = withRateLimit(handleChangePassword, { limit: 3, windowMs: 60 * 60 * 1000 }) // 3 attempts per hour
