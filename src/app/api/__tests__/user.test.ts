/**
 * @jest-environment node
 */
import { GET as getProfile, PATCH as updateProfile } from '../user/profile/route'
import { POST as changePassword } from '../user/change-password/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendEmail } from '@/lib/email'
import { TEST_HASHED_PASSWORD, TEST_NEW_HASHED_PASSWORD, TEST_PASSWORD, TEST_TOO_SHORT_PASSWORD } from '@/__tests__/test-constants'

// Mock dependencies
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
    authOptions: {},
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

jest.mock('@/lib/rateLimit', () => ({
    withRateLimit: jest.fn((handler) => handler),
}))

// Import getServerSession after mocking
import { getServerSession } from 'next-auth'

describe('/api/user', () => {
    const mockSession = {
        user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
        },
    }

    beforeEach(() => {
        jest.clearAllMocks()
            ; (getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    describe('Profile', () => {
        describe('GET', () => {
            it('should return 401 if not authenticated', async () => {
                (getServerSession as jest.Mock).mockResolvedValue(null)
                const req = new NextRequest('http://localhost/api/user/profile')
                const res = await getProfile(req)
                expect(res.status).toBe(401)
            })

            it('should return user profile', async () => {
                const mockUser = { id: 'user-123', email: 'test@example.com' }
                    ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

                const req = new NextRequest('http://localhost/api/user/profile')
                const res = await getProfile(req)
                const data = await res.json()

                expect(res.status).toBe(200)
                expect(data).toEqual(mockUser)
            })

            it('should return 404 if user not found', async () => {
                (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

                const req = new NextRequest('http://localhost/api/user/profile')
                const res = await getProfile(req)
                expect(res.status).toBe(404)
            })
        })

        describe('PATCH', () => {
            it('should return 401 if not authenticated', async () => {
                (getServerSession as jest.Mock).mockResolvedValue(null)
                const req = new NextRequest('http://localhost/api/user/profile', {
                    method: 'PATCH',
                    body: JSON.stringify({ name: 'New Name' }),
                })
                const res = await updateProfile(req)
                expect(res.status).toBe(401)
            })

            it('should update user profile', async () => {
                const req = new NextRequest('http://localhost/api/user/profile', {
                    method: 'PATCH',
                    body: JSON.stringify({ name: 'New Name' }),
                })

                    ; (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-123', name: 'New Name' })

                const res = await updateProfile(req)

                expect(res.status).toBe(200)
                expect(prisma.user.update).toHaveBeenCalledWith({
                    where: { id: mockSession.user.id },
                    data: expect.objectContaining({
                        name: 'New Name',
                        updatedAt: expect.any(Date)
                    })
                })
            })
        })
    })

    describe('Change Password', () => {
        const validBody = {
            currentPassword: TEST_PASSWORD,
            newPassword: TEST_PASSWORD,
        }

        it('should return 401 if not authenticated', async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null)
            const req = new NextRequest('http://localhost/api/user/change-password', {
                method: 'POST',
                body: JSON.stringify(validBody),
            })
            const res = await changePassword(req)
            expect(res.status).toBe(401)
        })

        it('should return 400 if passwords missing', async () => {
            const req = new NextRequest('http://localhost/api/user/change-password', {
                method: 'POST',
                body: JSON.stringify({}),
            })
            const res = await changePassword(req)
            expect(res.status).toBe(400)
        })

        it('should return 400 if new password too short', async () => {
            const req = new NextRequest('http://localhost/api/user/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword: TEST_PASSWORD, newPassword: TEST_TOO_SHORT_PASSWORD }),
            })
            const res = await changePassword(req)
            expect(res.status).toBe(400)
        })

        it('should return 400 if current password incorrect', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123', password: TEST_HASHED_PASSWORD })
                ; (bcrypt.compare as jest.Mock).mockResolvedValue(false)

            const req = new NextRequest('http://localhost/api/user/change-password', {
                method: 'POST',
                body: JSON.stringify(validBody),
            })
            const res = await changePassword(req)
            expect(res.status).toBe(400)
        })

        it('should change password successfully', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123', password: TEST_HASHED_PASSWORD, email: 'test@example.com' })
                ; (bcrypt.compare as jest.Mock).mockResolvedValue(true)
                ; (bcrypt.hash as jest.Mock).mockResolvedValue(TEST_NEW_HASHED_PASSWORD)
                ; (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-123' })

            const req = new NextRequest('http://localhost/api/user/change-password', {
                method: 'POST',
                body: JSON.stringify(validBody),
            })
            const res = await changePassword(req)

            expect(res.status).toBe(200)
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: expect.objectContaining({
                    password: TEST_NEW_HASHED_PASSWORD,
                    updatedAt: expect.any(Date)
                })
            })
            expect(sendEmail).toHaveBeenCalled()
        })
    })
})
