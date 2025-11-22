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

jest.mock('@/lib/rateLimit', () => ({
    withRateLimit: <T extends (...args: unknown[]) => unknown>(handler: T) => handler,
}))

global.fetch = jest.fn()

describe('/api/forgot-password', () => {
    beforeEach(() => {
        jest.clearAllMocks()
            ; (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ success: true }),
            })
    })

    it('should return 400 if nimOrUsername is missing', async () => {
        const req = new NextRequest('http://localhost/api/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ turnstileToken: 'token' }),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'NIM/Username diperlukan.' })
    })

    it('should return 400 if Turnstile fails', async () => {
        ; (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => ({ success: false }),
        })

        const req = new NextRequest('http://localhost/api/forgot-password', {
            method: 'POST',
            body: JSON.stringify({
                nimOrUsername: 'testuser',
                turnstileToken: 'invalid-token'
            }),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Verifikasi CAPTCHA gagal.' })
    })

    it('should return success even if user not found (enumeration protection)', async () => {
        ; (db.query as jest.Mock).mockResolvedValue({ rows: [] })

        const req = new NextRequest('http://localhost/api/forgot-password', {
            method: 'POST',
            body: JSON.stringify({
                nimOrUsername: 'nonexistent',
                turnstileToken: 'valid-token'
            }),
        })
        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({
            message: 'Jika akun ditemukan, kode verifikasi telah dikirim ke email Anda.'
        })
        expect(sendEmail).not.toHaveBeenCalled()
    })

    it('should send reset code if user exists', async () => {
        ; (db.query as jest.Mock)
            .mockResolvedValueOnce({
                rows: [{ id: 'user-123', email: 'test@example.com' }],
            })
            .mockResolvedValueOnce({ rows: [] }) // Update query

        const req = new NextRequest('http://localhost/api/forgot-password', {
            method: 'POST',
            body: JSON.stringify({
                nimOrUsername: 'testuser',
                turnstileToken: 'valid-token'
            }),
        })
        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'test@example.com',
                subject: 'Reset Password UPer.li',
            })
        )

        // Verify that verification code was set
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE "User"'),
            expect.arrayContaining([
                expect.stringMatching(/^\d{6}$/), // 6-digit code
                expect.any(Date),
                'user-123',
            ])
        )
    })
})
