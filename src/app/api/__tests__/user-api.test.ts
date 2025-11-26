/**
 * @jest-environment node
 */
import { GET as GET_PROFILE, PATCH as PATCH_PROFILE } from '../user/profile/route'
import { POST as CHANGE_PASSWORD } from '../user/change-password/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
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

jest.mock('@/lib/rateLimit', () => ({
    withRateLimit: jest.fn((handler) => handler),
}))

describe('User API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('GET /api/user/profile', () => {
        it('should return user profile', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                    id: 'user-1', email: 'test@example.com'
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
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

            const req = new NextRequest('http://localhost/api/user/profile')
            const res = await GET_PROFILE(req)

            expect(res.status).toBe(404)
        })
    })

    describe('PATCH /api/user/profile', () => {
        it('should update user profile', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
                ; (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

            const req = new NextRequest('http://localhost/api/user/profile', {
                method: 'PATCH',
                body: JSON.stringify({ name: 'New Name' })
            })
            const res = await PATCH_PROFILE(req)

            expect(res.status).toBe(200)
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: expect.objectContaining({
                    name: 'New Name',
                    updatedAt: expect.any(Date)
                })
            })
        })
    })

    describe('POST /api/user/change-password', () => {
        it('should change password successfully', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { email: 'test@example.com' } })
                ; (prisma.user.findUnique as jest.Mock)
                    .mockResolvedValue({ id: 'user-1', email: 'test@example.com', password: 'hashed-old' })
                ; (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

                ; (bcrypt.compare as jest.Mock).mockResolvedValue(true)
                ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new')

            const req = new NextRequest('http://localhost/api/user/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword: 'old', newPassword: 'new-password-123' })
            })
            const res = await CHANGE_PASSWORD(req)

            expect(res.status).toBe(200)
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: expect.objectContaining({
                    password: 'hashed-new',
                    updatedAt: expect.any(Date)
                })
            })
        })

        it('should reject incorrect current password', async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { email: 'test@example.com' } })
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1', password: 'hashed-old' });
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
