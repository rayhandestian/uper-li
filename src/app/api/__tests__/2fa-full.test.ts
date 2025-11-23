/**
 * @jest-environment node
 */
import { POST as VERIFY_2FA } from '../2fa/verify/route'
import { POST as DISABLE_2FA } from '../2fa/disable/route'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
    db: {
        query: jest.fn(),
    },
}))

describe('2FA Full API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('POST /api/2fa/verify', () => {
        it('should verify code and enable 2FA', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })

            const validUser = {
                id: 'user-1',
                twoFactorEnabled: false,
                twoFactorSecret: '123456',
                verificationTokenExpires: new Date(Date.now() + 10000)
            }

                ; (db.query as jest.Mock)
                    .mockResolvedValueOnce({ rows: [validUser] }) // Get user
                    .mockResolvedValueOnce({ rowCount: 1 }) // Update user

            const req = new NextRequest('http://localhost/api/2fa/verify', {
                method: 'POST',
                body: JSON.stringify({ code: '123456' })
            })
            const res = await VERIFY_2FA(req)

            expect(res.status).toBe(200)
            expect(db.query).toHaveBeenCalledTimes(2)
        })

        it('should return 400 if code is invalid', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })

            const validUser = {
                id: 'user-1',
                twoFactorEnabled: false,
                twoFactorSecret: '123456',
                verificationTokenExpires: new Date(Date.now() + 10000)
            }

                ; (db.query as jest.Mock).mockResolvedValueOnce({ rows: [validUser] })

            const req = new NextRequest('http://localhost/api/2fa/verify', {
                method: 'POST',
                body: JSON.stringify({ code: 'wrong' })
            })
            const res = await VERIFY_2FA(req)

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Kode verifikasi salah.' })
        })

        it('should return 400 if expired', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })

            const expiredUser = {
                id: 'user-1',
                twoFactorEnabled: false,
                twoFactorSecret: '123456',
                verificationTokenExpires: new Date(Date.now() - 10000)
            }

                ; (db.query as jest.Mock).mockResolvedValueOnce({ rows: [expiredUser] })

            const req = new NextRequest('http://localhost/api/2fa/verify', {
                method: 'POST',
                body: JSON.stringify({ code: '123456' })
            })
            const res = await VERIFY_2FA(req)

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Kode verifikasi telah kadaluarsa.' })
        })
    })

    describe('POST /api/2fa/disable', () => {
        it('should disable 2FA', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })

            const user = { id: 'user-1', twoFactorEnabled: true }

                ; (db.query as jest.Mock)
                    .mockResolvedValueOnce({ rows: [user] }) // Get user
                    .mockResolvedValueOnce({ rowCount: 1 }) // Update user

            const req = new NextRequest('http://localhost/api/2fa/disable', { method: 'POST' })
            const res = await DISABLE_2FA(req)

            expect(res.status).toBe(200)
            expect(db.query).toHaveBeenCalledTimes(2)
        })

        it('should return 400 if 2FA not enabled', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })

            const user = { id: 'user-1', twoFactorEnabled: false }

                ; (db.query as jest.Mock).mockResolvedValueOnce({ rows: [user] })

            const req = new NextRequest('http://localhost/api/2fa/disable', { method: 'POST' })
            const res = await DISABLE_2FA(req)

            expect(res.status).toBe(400)
        })
    })
})
