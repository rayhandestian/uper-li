/**
 * @jest-environment node
 */
import { POST as SETUP_2FA } from '../2fa/setup/route'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { sendEmail } from '@/lib/email'

// Mock dependencies
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}))

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

describe('2FA API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('POST /api/2fa/setup', () => {
        it('should initiate 2FA setup', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
                ; (db.query as jest.Mock)
                    .mockResolvedValueOnce({ rows: [{ id: 'user-1', email: 'test@example.com', twoFactorEnabled: false }] }) // Get user
                    .mockResolvedValueOnce({ rowCount: 1 }) // Update user with secret

            const req = new NextRequest('http://localhost/api/2fa/setup', { method: 'POST' })
            const res = await SETUP_2FA(req)

            expect(res.status).toBe(200)
            expect(sendEmail).toHaveBeenCalled()
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE "User"'),
                expect.arrayContaining(['user-1'])
            )
        })

        it('should return 400 if 2FA already enabled', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
                ; (db.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'user-1', twoFactorEnabled: true }] })

            const req = new NextRequest('http://localhost/api/2fa/setup', { method: 'POST' })
            const res = await SETUP_2FA(req)

            expect(res.status).toBe(400)
        })

        it('should return 401 if unauthorized', async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null)

            const req = new NextRequest('http://localhost/api/2fa/setup', { method: 'POST' })
            const res = await SETUP_2FA(req)

            expect(res.status).toBe(401)
        })
    })
})
