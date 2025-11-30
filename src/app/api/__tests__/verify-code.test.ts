/**
 * @jest-environment node
 */
import { POST } from '../verify-code/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TEST_VERIFICATION_CODE } from '@/__tests__/test-constants'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findFirst: jest.fn(),
            update: jest.fn(),
        },
    },
}))

jest.mock('@/lib/rateLimit', () => ({
    withRateLimit: <T extends (...args: unknown[]) => unknown>(handler: T) => handler,
}))

jest.mock('@/lib/verificationAttempts', () => ({
    isAccountLocked: jest.fn().mockResolvedValue(false),
    recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
    clearAttempts: jest.fn().mockResolvedValue(undefined),
}))

describe('/api/verify-code', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return 400 if code is missing', async () => {
        const req = new NextRequest('http://localhost/api/verify-code', {
            method: 'POST',
            body: JSON.stringify({}),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it('should return 400 if code is not 6 digits', async () => {
        const req = new NextRequest('http://localhost/api/verify-code', {
            method: 'POST',
            body: JSON.stringify({ code: '12345' }),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({
            error: 'Kode verifikasi diperlukan dan harus 6 karakter.'
        })
    })

    it('should return 400 if code is invalid', async () => {
        ; (prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

        const req = new NextRequest('http://localhost/api/verify-code', {
            method: 'POST',
            body: JSON.stringify({ code: TEST_VERIFICATION_CODE }),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Kode verifikasi tidak valid.' })
    })

    it('should return 400 if code has expired', async () => {
        const expiredDate = new Date(Date.now() - 1000) // 1 second ago
            ; (prisma.user.findFirst as jest.Mock).mockResolvedValue({
                id: 'user-123',
                verificationTokenExpires: expiredDate,
                emailVerified: null,
            })

        const req = new NextRequest('http://localhost/api/verify-code', {
            method: 'POST',
            body: JSON.stringify({ code: TEST_VERIFICATION_CODE }),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Kode verifikasi telah kadaluarsa.' })
    })

    it('should return 400 if account already verified', async () => {
        ; (prisma.user.findFirst as jest.Mock).mockResolvedValue({
            id: 'user-123',
            verificationTokenExpires: new Date(Date.now() + 10000),
            emailVerified: new Date(),
        })

        const req = new NextRequest('http://localhost/api/verify-code', {
            method: 'POST',
            body: JSON.stringify({ code: TEST_VERIFICATION_CODE }),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Akun sudah diverifikasi.' })
    })

    it('should verify account successfully', async () => {
        const futureDate = new Date(Date.now() + 10000)
            ; (prisma.user.findFirst as jest.Mock).mockResolvedValue({
                id: 'user-123',
                verificationTokenExpires: futureDate,
                emailVerified: null,
                updatedAt: new Date(),
            })
            ; (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-123' })

        const req = new NextRequest('http://localhost/api/verify-code', {
            method: 'POST',
            body: JSON.stringify({ code: TEST_VERIFICATION_CODE }),
        })
        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({ message: 'Verifikasi berhasil.' })

        // Verify update was called
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 'user-123' },
            data: expect.objectContaining({
                emailVerified: expect.any(Date),
                verificationToken: null,
                verificationTokenExpires: null
            })
        })
    })
})
