/**
 * @jest-environment node
 */
import { POST } from '../forgot-password/route'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

// Mock dependencies
jest.mock('@/lib/db', () => ({
    db: {
        query: jest.fn(),
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
        (db.query as jest.Mock)
            .mockResolvedValueOnce({ rows: [{ id: 'user-1', email: 'test@example.com', nimOrUsername: 'testuser', emailVerified: new Date() }] }) // Find user (verified)
            .mockResolvedValueOnce({ rowCount: 1 }) // Insert code

        const req = new NextRequest('http://localhost/api/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ nimOrUsername: 'testuser', turnstileToken: 'turnstile-token' })
        })

        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
            to: 'test@example.com',
            subject: expect.stringContaining('Reset Password')
        }))
    })

    it('should return 200 even if user not found (security)', async () => {
        (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] }) // User not found

        const req = new NextRequest('http://localhost/api/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ nimOrUsername: 'unknown', turnstileToken: 'turnstile-token' })
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
            body: JSON.stringify({ nimOrUsername: 'testuser', turnstileToken: 'invalid-token' })
        })

        const res = await POST(req)

        expect(res.status).toBe(400)
        expect(await res.json()).toEqual(expect.objectContaining({ error: expect.stringContaining('CAPTCHA') }))
    })

    it('should return success but not send email for unverified user (security)', async () => {
        (db.query as jest.Mock)
            .mockResolvedValueOnce({ rows: [{ id: 'user-1', email: 'test@example.com', nimOrUsername: 'testuser', emailVerified: null }] }) // Find user (unverified)
            // No second mock call because we don't want to update the token for unverified users

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
