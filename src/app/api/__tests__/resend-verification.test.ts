/**
 * @jest-environment node
 */
import { POST } from '../resend-verification/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}))

jest.mock('@/lib/email', () => ({
    sendEmail: jest.fn(),
}))

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
}))

// Mock rate limit wrapper
jest.mock('@/lib/rateLimit', () => ({
    withRateLimit: <T extends (...args: unknown[]) => unknown>(handler: T) => handler,
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}))

describe('/api/resend-verification', () => {
    const validBody = {
        nimOrUsername: '12345678',
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return 400 if nimOrUsername is missing', async () => {
        const req = new NextRequest('http://localhost/api/resend-verification', {
            method: 'POST',
            body: JSON.stringify({ nimOrUsername: '' }),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'NIM/Username diperlukan.' })
    })

    it('should return 400 if password is too short', async () => {
        const req = new NextRequest('http://localhost/api/resend-verification', {
            method: 'POST',
            body: JSON.stringify({
                nimOrUsername: '12345678',
                password: '123', // Less than 6 characters
            }),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Password minimal 6 karakter.' })
    })

    it('should return 404 if user not found', async () => {
        ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

        const req = new NextRequest('http://localhost/api/resend-verification', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        const res = await POST(req)
        expect(res.status).toBe(404)
        expect(await res.json()).toEqual({ error: 'Akun tidak ditemukan.' })
    })

    it('should return 400 if user already verified', async () => {
        ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-123',
            email: 'test@student.universitaspertamina.ac.id',
            role: 'STUDENT',
            emailVerified: new Date() // Already verified
        })

        const req = new NextRequest('http://localhost/api/resend-verification', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Akun sudah diverifikasi. Silakan masuk.' })
    })

    it('should resend verification code without updating password', async () => {
        ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-123',
            email: 'test@student.universitaspertamina.ac.id',
            role: 'STUDENT',
            emailVerified: null // Not verified
        })
            ; (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-123' })

            ; (sendEmail as jest.Mock).mockResolvedValue({ messageId: 'test-id' })

        const req = new NextRequest('http://localhost/api/resend-verification', {
            method: 'POST',
            body: JSON.stringify({
                nimOrUsername: '12345678',
                // No password provided
            }),
        })
        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(sendEmail).toHaveBeenCalled()

        const response = await res.json()
        expect(response.message).toContain('Kode verifikasi baru telah dikirim')
    })

    it('should update password and resend verification code', async () => {
        const bcrypt = jest.requireMock('bcryptjs')
        bcrypt.hash = jest.fn().mockResolvedValue('hashed-new-password')

            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'user-123',
                email: 'test@student.universitaspertamina.ac.id',
                role: 'STUDENT',
                emailVerified: null // Not verified
            })
            ; (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-123' })

            ; (sendEmail as jest.Mock).mockResolvedValue({ messageId: 'test-id' })

        const req = new NextRequest('http://localhost/api/resend-verification', {
            method: 'POST',
            body: JSON.stringify({
                nimOrUsername: '12345678',
                password: 'newpassword123', // New password
            }),
        })
        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 12)
        expect(sendEmail).toHaveBeenCalled()

        const response = await res.json()
        expect(response.message).toContain('Password berhasil diubah')
    })

    it('should log password update for security', async () => {
        const bcrypt = jest.requireMock('bcryptjs')
        bcrypt.hash = jest.fn().mockResolvedValue('hashed-new-password')
        const { logger } = await import('@/lib/logger')

            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'user-123',
                email: 'test@student.universitaspertamina.ac.id',
                role: 'STUDENT',
                emailVerified: null
            })
            ; (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-123' })

            ; (sendEmail as jest.Mock).mockResolvedValue({ messageId: 'test-id' })

        const req = new NextRequest('http://localhost/api/resend-verification', {
            method: 'POST',
            body: JSON.stringify({
                nimOrUsername: '12345678',
                password: 'newpassword123',
            }),
        })
        await POST(req)

        expect(logger.info).toHaveBeenCalledWith(
            'Password updated for user during resend verification',
            expect.objectContaining({
                userId: 'user-123',
                nimOrUsername: '12345678',
                timestamp: expect.any(Date),
            })
        )
    })

    it('should generate new 6-digit verification code', async () => {
        ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-123',
            email: 'test@student.universitaspertamina.ac.id',
            role: 'STUDENT',
            emailVerified: null
        })
            ; (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-123' })

            ; (sendEmail as jest.Mock).mockResolvedValue({ messageId: 'test-id' })

        const req = new NextRequest('http://localhost/api/resend-verification', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        await POST(req)

        // Check that update was called with verification code (6 digits)
        const updateCall = (prisma.user.update as jest.Mock).mock.calls[0]
        expect(updateCall).toBeDefined()
        const verificationToken = updateCall[0].data.verificationToken
        expect(verificationToken).toMatch(/^\d{6}$/)
    })

    it('should update verification token with 10-minute expiry', async () => {
        const now = Date.now()
        jest.spyOn(Date, 'now').mockReturnValue(now)

            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'user-123',
                email: 'test@student.universitaspertamina.ac.id',
                role: 'STUDENT',
                emailVerified: null
            })
            ; (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-123' })

            ; (sendEmail as jest.Mock).mockResolvedValue({ messageId: 'test-id' })

        const req = new NextRequest('http://localhost/api/resend-verification', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        await POST(req)

        // Check that update includes correct expiry time (10 minutes from now)
        const updateCall = (prisma.user.update as jest.Mock).mock.calls[0]
        expect(updateCall).toBeDefined()
        const expiryTime = updateCall[0].data.verificationTokenExpires
        expect(expiryTime).toEqual(new Date(now + 10 * 60 * 1000))

        jest.restoreAllMocks()
    })

    it('should handle server errors gracefully', async () => {
        ; (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

        const req = new NextRequest('http://localhost/api/resend-verification', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        const res = await POST(req)
        expect(res.status).toBe(500)
        expect(await res.json()).toEqual({ error: 'Terjadi kesalahan server.' })
    })
})