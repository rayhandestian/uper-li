/**
 * @jest-environment node
 */
import { POST } from '../forgot-password/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { TEST_INVALID_TOKEN, TEST_TURNSTILE_TOKEN } from '@/__tests__/test-constants'

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

jest.mock('@/lib/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}))

global.fetch = jest.fn()

describe('Forgot Password API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
            ; (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ success: true }),
            })
    })

    it('should send reset email for valid user', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-1',
            email: 'test@example.com',
            nimOrUsername: 'testuser',
            emailVerified: new Date()
        })
            ; (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

        const req = new NextRequest('http://localhost/api/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ nimOrUsername: 'testuser', turnstileToken: TEST_TURNSTILE_TOKEN })
        })

        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
            to: 'test@example.com',
            subject: expect.stringContaining('Reset Password')
        }))
    })

    it('should return 200 even if user not found (security)', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

        const req = new NextRequest('http://localhost/api/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ nimOrUsername: 'unknown', turnstileToken: TEST_TURNSTILE_TOKEN })
        })

        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(sendEmail).not.toHaveBeenCalled()
    })

    it('should handle Turnstile validation failure', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => ({ success: false }),
        })

        const req = new NextRequest('http://localhost/api/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ nimOrUsername: 'testuser', turnstileToken: TEST_INVALID_TOKEN })
        })

        const res = await POST(req)

        expect(res.status).toBe(400)
        expect(await res.json()).toEqual(expect.objectContaining({ error: expect.stringContaining('CAPTCHA') }))
    })

    it('should return success but not send email for unverified user (security)', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-1',
            email: 'test@example.com',
            nimOrUsername: 'testuser',
            emailVerified: null
        })

        const req = new NextRequest('http://localhost/api/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ nimOrUsername: 'testuser', turnstileToken: 'turnstile-token' })
        })

        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(sendEmail).not.toHaveBeenCalled()
        expect(await res.json()).toEqual({ message: 'Jika akun ditemukan, kode verifikasi telah dikirim ke email Anda.' })
    })
})
