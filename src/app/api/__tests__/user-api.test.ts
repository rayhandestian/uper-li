/**
 * @jest-environment node
 */
import { GET as GET_PROFILE, PATCH as PATCH_PROFILE } from '../user/profile/route'
import { POST as CHANGE_PASSWORD } from '../user/change-password/route'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
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

jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}))

jest.mock('@/lib/email', () => ({
    sendEmail: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}))

describe('User API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('GET /api/user/profile', () => {
        it('should return user profile', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
                ; (db.query as jest.Mock).mockResolvedValue({
                    rows: [{ id: 'user-1', email: 'test@example.com' }]
                })

            const req = new NextRequest('http://localhost/api/user/profile')
            const res = await GET_PROFILE(req)

            expect(res.status).toBe(200)
            expect(await res.json()).toEqual({ id: 'user-1', email: 'test@example.com' })
        })

        it('should return 401 if not authenticated', async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null)

            const req = new NextRequest('http://localhost/api/user/profile')
            const res = await GET_PROFILE(req)

            expect(res.status).toBe(401)
        })

        it('should return 404 if user not found', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
                ; (db.query as jest.Mock).mockResolvedValue({ rows: [] })

            const req = new NextRequest('http://localhost/api/user/profile')
            const res = await GET_PROFILE(req)

            expect(res.status).toBe(404)
        })
    })

    describe('PATCH /api/user/profile', () => {
        it('should update user profile', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
                ; (db.query as jest.Mock).mockResolvedValue({ rowCount: 1 })

            const req = new NextRequest('http://localhost/api/user/profile', {
                method: 'PATCH',
                body: JSON.stringify({ name: 'New Name' })
            })
            const res = await PATCH_PROFILE(req)

            expect(res.status).toBe(200)
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE "User"'),
                ['New Name', 'user-1']
            )
        })
    })

    describe('POST /api/user/change-password', () => {
        it('should change password successfully', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { email: 'test@example.com' } })
                ; (db.query as jest.Mock)
                    .mockResolvedValueOnce({ rows: [{ id: 'user-1', email: 'test@example.com', password: 'hashed-old' }] }) // Get user
                    .mockResolvedValueOnce({ rowCount: 1 }); // Update password

            (bcrypt.compare as jest.Mock).mockResolvedValue(true)
                ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new')

            const req = new NextRequest('http://localhost/api/user/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword: 'old', newPassword: 'new-password-123' })
            })
            const res = await CHANGE_PASSWORD(req)

            expect(res.status).toBe(200)
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE "User"'),
                ['hashed-new', 'user-1']
            )
        })

        it('should reject incorrect current password', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { email: 'test@example.com' } })
                ; (db.query as jest.Mock).mockResolvedValue({ rows: [{ id: 'user-1', password: 'hashed-old' }] });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false)

            const req = new NextRequest('http://localhost/api/user/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword: 'wrong', newPassword: 'new-password-123' })
            })
            const res = await CHANGE_PASSWORD(req)

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Password saat ini salah' })
        })
    })
})
