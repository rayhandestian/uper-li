/**
 * @jest-environment node
 */
import { POST } from '../resend-verification/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { TEST_PASSWORD } from '@/__tests__/test-constants'

jest.mock('@/lib/email', () => ({
    sendEmail: jest.fn(),
}))

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
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

    it('should return success message even if user not found', async () => {
        ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

        const req = new NextRequest('http://localhost/api/resend-verification', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        const res = await POST(req)
        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({ message: 'Jika akun ditemukan, kode verifikasi telah dikirim ke email Anda.' })
    })

    it('should return success message even if user already verified', async () => {
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
        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({ message: 'Jika akun ditemukan, kode verifikasi telah dikirim ke email Anda.' })
    })

    it('should resend verification code successfully', async () => {
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
            }),
        })
        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(sendEmail).toHaveBeenCalled()

        const response = await res.json()
        expect(response.message).toBe('Jika akun ditemukan, kode verifikasi telah dikirim ke email Anda.')
    })

    it('should generate new 6-character alphanumeric verification code', async () => {
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

        // Check that update was called with verification code (6 alphanumeric characters)
        const updateCall = (prisma.user.update as jest.Mock).mock.calls[0]
        expect(updateCall).toBeDefined()
        const verificationToken = updateCall[0].data.verificationToken
        expect(verificationToken).toMatch(/^[a-z0-9]{6}$/)

        // Verify password was NOT included in update
        expect(updateCall[0].data.password).toBeUndefined()
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

    it('should not accept password parameter', async () => {
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
            body: JSON.stringify({ ...validBody, password: TEST_PASSWORD }),
        })
        await POST(req)

        const updateCall = (prisma.user.update as jest.Mock).mock.calls[0]
        expect(updateCall[0].data.password).toBeUndefined()
    })
})