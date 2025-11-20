import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { withRateLimit } from '@/lib/rateLimit'

async function handleResetPassword(request: NextRequest) {
    try {
        const { nimOrUsername, code, newPassword, confirmPassword } = await request.json()

        if (!nimOrUsername || !code || !newPassword || !confirmPassword) {
            return NextResponse.json({ error: 'Semua field harus diisi.' }, { status: 400 })
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json({ error: 'Password tidak cocok.' }, { status: 400 })
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 })
        }

        // Find user by nimOrUsername and verificationToken
        const userResult = await db.query(
            'SELECT id, "verificationTokenExpires" FROM "User" WHERE "nimOrUsername" = $1 AND "verificationToken" = $2',
            [nimOrUsername, code]
        )

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'Kode verifikasi salah atau user tidak ditemukan.' }, { status: 400 })
        }

        const user = userResult.rows[0]

        // Check expiration
        if (new Date() > new Date(user.verificationTokenExpires)) {
            return NextResponse.json({ error: 'Kode verifikasi telah kadaluarsa.' }, { status: 400 })
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12)

        // Update password and clear verification token
        await db.query(
            `UPDATE "User" 
       SET password = $1, "verificationToken" = null, "verificationTokenExpires" = null, "updatedAt" = NOW()
       WHERE id = $2`,
            [hashedPassword, user.id]
        )

        return NextResponse.json({ message: 'Password berhasil diubah. Silakan login dengan password baru.' })
    } catch (error) {
        console.error('Reset password error:', error)
        return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
    }
}

export const POST = withRateLimit(handleResetPassword, { limit: 5, windowMs: 15 * 60 * 1000 }) // 5 attempts per 15 minutes
