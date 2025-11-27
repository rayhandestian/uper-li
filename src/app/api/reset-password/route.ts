import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isAccountLocked, recordFailedAttempt, clearAttempts } from '@/lib/verificationAttempts'
import { withRateLimit } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

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

        // Find user by nimOrUsername and verificationToken using Prisma
        const user = await prisma.user.findFirst({
            where: {
                nimOrUsername,
                verificationToken: code
            },
            select: {
                id: true,
                verificationTokenExpires: true,
                emailVerified: true
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'Kode verifikasi salah atau user tidak ditemukan.' }, { status: 400 })
        }

        // Check if account is locked due to too many failed password reset attempts
        const locked = await isAccountLocked(user.id, 'password_reset')
        if (locked) {
            logger.warn(`Account locked for password reset attempts`, { userId: user.id })
            return NextResponse.json({ error: 'Akun terkunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam 1 jam.' }, { status: 429 })
        }

        // Check if user email is verified
        if (!user.emailVerified) {
            await recordFailedAttempt(user.id, 'password_reset')
            return NextResponse.json({ error: 'Akun belum diverifikasi. Silakan verifikasi email terlebih dahulu.' }, { status: 400 })
        }

        // Check expiration
        if (user.verificationTokenExpires && new Date() > new Date(user.verificationTokenExpires)) {
            await recordFailedAttempt(user.id, 'password_reset')
            return NextResponse.json({ error: 'Kode verifikasi telah kadaluarsa.' }, { status: 400 })
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12)

        // Update password and clear verification token using Prisma
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                verificationToken: null,
                verificationTokenExpires: null,
                updatedAt: new Date()
            }
        })

        // Clear failed attempts on successful password reset
        await clearAttempts(user.id, 'password_reset')

        return NextResponse.json({ message: 'Password berhasil diubah. Silakan login dengan password baru.' })
    } catch (error) {
        logger.error('Reset password error:', error)
        return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
    }
}

export const POST = withRateLimit(handleResetPassword, { limit: 5, windowMs: 15 * 60 * 1000 }) // 5 attempts per 15 minutes
