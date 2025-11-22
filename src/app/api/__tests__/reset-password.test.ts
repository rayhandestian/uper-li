/**
 * @jest-environment node
 */
import { POST } from '../reset-password/route'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Mock dependencies
jest.mock('@/lib/db', () => ({
    db: {
        query: jest.fn(),
    },
}))

jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
}))

jest.mock('@/lib/rateLimit', () => ({
    withRateLimit: <T extends (...args: unknown[]) => unknown>(handler: T) => handler,
}))

describe('/api/reset-password', () => {
    const validBody = {
        nimOrUsername: 'testuser',
        code: '123456',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return 400 if any field is missing', async () => {
        const req = new NextRequest('http://localhost/api/reset-password', {
            method: 'POST',
            body: JSON.stringify({ nimOrUsername: 'testuser' }),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Semua field harus diisi.' })
    })

    it('should return 400 if passwords do not match', async () => {
        const req = new NextRequest('http://localhost/api/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                ...validBody,
                confirmPassword: 'different',
            }),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Password tidak cocok.' })
    })

    it('should return 400 if password too short', async () => {
        const req = new NextRequest('http://localhost/api/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                ...validBody,
                newPassword: '12345',
                confirmPassword: '12345',
            }),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Password minimal 6 karakter.' })
    })

    it('should return 400 if code is invalid', async () => {
        ; (db.query as jest.Mock).mockResolvedValue({ rows: [] })

        const req = new NextRequest('http://localhost/api/reset-password', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({
            error: 'Kode verifikasi salah atau user tidak ditemukan.'
        })
    })

    it('should return 400 if code has expired', async () => {
        const expiredDate = new Date(Date.now() - 1000)
            ; (db.query as jest.Mock).mockResolvedValue({
                rows: [{
                    id: 'user-123',
                    verificationTokenExpires: expiredDate,
                }],
            })

        const req = new NextRequest('http://localhost/api/reset-password', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Kode verifikasi telah kadaluarsa.' })
    })

    it('should reset password successfully', async () => {
        const futureDate = new Date(Date.now() + 10000)
            ; (db.query as jest.Mock)
                .mockResolvedValueOnce({
                    rows: [{
                        id: 'user-123',
                        verificationTokenExpires: futureDate,
                    }],
                })
                .mockResolvedValueOnce({ rows: [] }) // Update query
            ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password')

        const req = new NextRequest('http://localhost/api/reset-password', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 12)
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE "User"'),
            ['hashed-new-password', 'user-123']
        )
        expect(await res.json()).toEqual({
            message: 'Password berhasil diubah. Silakan login dengan password baru.'
        })
    })
})
