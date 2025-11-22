/**
 * @jest-environment node
 */
import { POST } from '../verify-code/route'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

// Mock dependencies
jest.mock('@/lib/db', () => ({
    db: {
        query: jest.fn(),
    },
}))

jest.mock('@/lib/rateLimit', () => ({
    withRateLimit: <T extends (...args: unknown[]) => unknown>(handler: T) => handler,
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
            error: 'Kode verifikasi diperlukan dan harus 6 digit.'
        })
    })

    it('should return 400 if code is invalid', async () => {
        ; (db.query as jest.Mock).mockResolvedValue({ rows: [] })

        const req = new NextRequest('http://localhost/api/verify-code', {
            method: 'POST',
            body: JSON.stringify({ code: '123456' }),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Kode verifikasi tidak valid.' })
    })

    it('should return 400 if code has expired', async () => {
        const expiredDate = new Date(Date.now() - 1000) // 1 second ago
            ; (db.query as jest.Mock).mockResolvedValue({
                rows: [{
                    id: 'user-123',
                    verificationTokenExpires: expiredDate,
                    emailVerified: null,
                }],
            })

        const req = new NextRequest('http://localhost/api/verify-code', {
            method: 'POST',
            body: JSON.stringify({ code: '123456' }),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Kode verifikasi telah kadaluarsa.' })
    })

    it('should return 400 if account already verified', async () => {
        ; (db.query as jest.Mock).mockResolvedValue({
            rows: [{
                id: 'user-123',
                verificationTokenExpires: new Date(Date.now() + 10000),
                emailVerified: new Date(),
            }],
        })

        const req = new NextRequest('http://localhost/api/verify-code', {
            method: 'POST',
            body: JSON.stringify({ code: '123456' }),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Akun sudah diverifikasi.' })
    })

    it('should verify account successfully', async () => {
        const futureDate = new Date(Date.now() + 10000)
            ; (db.query as jest.Mock)
                .mockResolvedValueOnce({
                    rows: [{
                        id: 'user-123',
                        verificationTokenExpires: futureDate,
                        emailVerified: null,
                    }],
                })
                .mockResolvedValueOnce({ rows: [] }) // Update query

        const req = new NextRequest('http://localhost/api/verify-code', {
            method: 'POST',
            body: JSON.stringify({ code: '123456' }),
        })
        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({ message: 'Verifikasi berhasil.' })

        // Verify update query was called
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE "User"'),
            ['user-123']
        )
    })
})
