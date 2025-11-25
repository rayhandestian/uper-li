/**
 * @jest-environment node
 */
import { POST } from '../resend-verification/route'
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

// Mock rate limit wrapper
jest.mock('@/lib/rateLimit', () => ({
    withRateLimit: <T extends (...args: unknown[]) => unknown>(handler: T) => handler,
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

    it('should return 404 if user not found', async () => {
        ; (db.query as jest.Mock).mockResolvedValue({ rows: [] })

        const req = new NextRequest('http://localhost/api/resend-verification', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        const res = await POST(req)
        expect(res.status).toBe(404)
        expect(await res.json()).toEqual({ error: 'Akun tidak ditemukan.' })
    })

    it('should return 400 if user already verified', async () => {
        ; (db.query as jest.Mock).mockResolvedValueOnce({ 
            rows: [{ 
                id: 'user-123', 
                email: 'test@student.universitaspertamina.ac.id',
                role: 'STUDENT',
                emailVerified: new Date() // Already verified
            }] 
        })

        const req = new NextRequest('http://localhost/api/resend-verification', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Akun sudah diverifikasi. Silakan masuk.' })
    })

    it('should resend verification code successfully', async () => {
        ; (db.query as jest.Mock)
            .mockResolvedValueOnce({ 
                rows: [{ 
                    id: 'user-123', 
                    email: 'test@student.universitaspertamina.ac.id',
                    role: 'STUDENT',
                    emailVerified: null // Not verified
                }] 
            })
            .mockResolvedValueOnce({ rows: [] }) // Update query

        ; (sendEmail as jest.Mock).mockResolvedValue({ messageId: 'test-id' })

        const req = new NextRequest('http://localhost/api/resend-verification', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(sendEmail).toHaveBeenCalledWith({
            to: 'test@student.universitaspertamina.ac.id',
            from: 'noreply@uper.li',
            subject: 'Verifikasi Akun UPer.li',
            html: expect.any(String), // HTML content
        })

        const response = await res.json()
        expect(response.message).toContain('Kode verifikasi baru telah dikirim')
    })

    it('should generate new 6-digit verification code', async () => {
        ; (db.query as jest.Mock)
            .mockResolvedValueOnce({ 
                rows: [{ 
                    id: 'user-123', 
                    email: 'test@student.universitaspertamina.ac.id',
                    role: 'STUDENT',
                    emailVerified: null
                }] 
            })
            .mockResolvedValueOnce({ rows: [] })

        ; (sendEmail as jest.Mock).mockResolvedValue({ messageId: 'test-id' })

        const req = new NextRequest('http://localhost/api/resend-verification', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        await POST(req)

        // Check that UPDATE query includes new verification code (6 digits)
        const updateCall = (db.query as jest.Mock).mock.calls.find(
            call => call[0].includes('UPDATE "User"')
        )
        expect(updateCall).toBeDefined()
        const verificationCode = updateCall[1][0] // 1st parameter
        expect(verificationCode).toMatch(/^\d{6}$/)
    })

    it('should update verification token with 10-minute expiry', async () => {
        const now = Date.now()
        jest.spyOn(Date, 'now').mockReturnValue(now)

        ; (db.query as jest.Mock)
            .mockResolvedValueOnce({ 
                rows: [{ 
                    id: 'user-123', 
                    email: 'test@student.universitaspertamina.ac.id',
                    role: 'STUDENT',
                    emailVerified: null
                }] 
            })
            .mockResolvedValueOnce({ rows: [] })

        ; (sendEmail as jest.Mock).mockResolvedValue({ messageId: 'test-id' })

        const req = new NextRequest('http://localhost/api/resend-verification', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        await POST(req)

        // Check that UPDATE query includes correct expiry time (10 minutes from now)
        const updateCall = (db.query as jest.Mock).mock.calls.find(
            call => call[0].includes('UPDATE "User"')
        )
        expect(updateCall).toBeDefined()
        const expiryTime = updateCall[1][1] // 2nd parameter
        expect(expiryTime).toEqual(new Date(now + 10 * 60 * 1000))
        
        jest.restoreAllMocks()
    })

    it('should handle server errors gracefully', async () => {
        ; (db.query as jest.Mock).mockRejectedValue(new Error('Database error'))

        const req = new NextRequest('http://localhost/api/resend-verification', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        const res = await POST(req)
        expect(res.status).toBe(500)
        expect(await res.json()).toEqual({ error: 'Terjadi kesalahan server.' })
    })
})