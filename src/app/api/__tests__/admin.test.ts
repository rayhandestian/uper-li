/**
 * @jest-environment node
 */
import { GET as usersGET } from '../admin/users/route'
import { PATCH as usersPATCH } from '../admin/users/[id]/route'
import { GET as linksGET } from '../admin/links/route'
import { POST as verifyPasswordPOST } from '../verify-link-password/route'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import {
    createMockRequest,
    createMockParams,
} from '@/__tests__/test-utils'

// Mock dependencies
jest.mock('next/headers', () => ({
    cookies: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            count: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
        link: {
            count: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
        rateLimit: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
        },
    },
}))

jest.mock('@/lib/admin-auth', () => ({
    validateAdminSession: jest.fn(),
    extendSessionActivity: jest.fn(),
}))

jest.mock('@/lib/admin-audit', () => ({
    logAdminAction: jest.fn(),
    AUDIT_ACTIONS: {
        USER_VIEW: 'USER_VIEW',
        USER_UPDATE: 'USER_UPDATE',
        LINK_VIEW: 'LINK_VIEW',
        LINK_DELETE: 'LINK_DELETE',
    },
}))

jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}))

jest.mock('@/lib/rateLimit', () => ({
    withRateLimit: (handler: unknown) => handler, // Pass through without rate limiting in tests
}))

jest.mock('@/lib/timing', () => ({
    addConstantDelay: jest.fn().mockResolvedValue(undefined),
}))

import { cookies } from 'next/headers'
import { validateAdminSession } from '@/lib/admin-auth'

const mockAdmin = {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
    active: true,
}

describe('Admin & Additional Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('GET /api/admin/users', () => {
        it('should return 401 if not authenticated', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue(null),
            })
                ; (validateAdminSession as jest.Mock).mockResolvedValue(null)

            const req = createMockRequest('http://localhost/api/admin/users')
            const res = await usersGET(req)

            expect(res.status).toBe(401)
            expect(await res.json()).toEqual({ error: 'Unauthorized' })
        })

        it('should return 401 if session invalid', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'invalid-session' }),
            })
                ; (validateAdminSession as jest.Mock).mockResolvedValue(null)

            const req = createMockRequest('http://localhost/api/admin/users')
            const res = await usersGET(req)

            expect(res.status).toBe(401)
        })

        it('should return paginated users', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'valid-session' }),
            })
                ; (validateAdminSession as jest.Mock).mockResolvedValue(mockAdmin)
                ; (prisma.user.count as jest.Mock).mockResolvedValue(50)
                ; (prisma.user.findMany as jest.Mock).mockResolvedValue([
                    {
                        id: 'user-1',
                        email: 'user1@example.com',
                        nimOrUsername: 'user1',
                        role: 'USER',
                    },
                    {
                        id: 'user-2',
                        email: 'user2@example.com',
                        nimOrUsername: 'user2',
                        role: 'USER',
                    },
                ])

            const req = createMockRequest('http://localhost/api/admin/users')
            const res = await usersGET(req)

            expect(res.status).toBe(200)
            const data = await res.json()
            expect(data.users).toHaveLength(2)
            expect(data.pagination.total).toBe(50)
            expect(data.pagination.page).toBe(1)
        })

        it('should filter by search query', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'valid-session' }),
            })
                ; (validateAdminSession as jest.Mock).mockResolvedValue(mockAdmin)
                ; (prisma.user.count as jest.Mock).mockResolvedValue(1)
                ; (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'user-1', nimOrUsername: 'testuser' }])

            const req = createMockRequest('http://localhost/api/admin/users?search=testuser')
            await usersGET(req)

            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            expect.objectContaining({ nimOrUsername: expect.objectContaining({ contains: 'testuser' }) })
                        ])
                    })
                })
            )
        })

        it('should filter by role', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'valid-session' }),
            })
                ; (validateAdminSession as jest.Mock).mockResolvedValue(mockAdmin)
                ; (prisma.user.count as jest.Mock).mockResolvedValue(5)
                ; (prisma.user.findMany as jest.Mock).mockResolvedValue([])

            const req = createMockRequest('http://localhost/api/admin/users?role=ADMIN')
            await usersGET(req)

            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        role: 'ADMIN'
                    })
                })
            )
        })
    })

    describe('PATCH /api/admin/users/[id]', () => {
        it('should return 401 if not authenticated', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue(null),
            })
                ; (validateAdminSession as jest.Mock).mockResolvedValue(null)

            const req = createMockRequest('http://localhost/api/admin/users/user-123', {
                method: 'PATCH',
                body: { active: false },
            })
            const res = await usersPATCH(req, { params: createMockParams({ id: 'user-123' }) })

            expect(res.status).toBe(401)
        })

        it('should return 400 if no fields to update', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'valid-session' }),
            })
                ; (validateAdminSession as jest.Mock).mockResolvedValue(mockAdmin)

            const req = createMockRequest('http://localhost/api/admin/users/user-123', {
                method: 'PATCH',
                body: {},
            })
            const res = await usersPATCH(req, { params: createMockParams({ id: 'user-123' }) })

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'No valid fields to update' })
        })

        it('should return 404 if user not found', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'valid-session' }),
            })
                ; (validateAdminSession as jest.Mock).mockResolvedValue(mockAdmin)
                ; (prisma.user.update as jest.Mock).mockRejectedValue({ code: 'P2025' }) // Prisma error for record not found

            const req = createMockRequest('http://localhost/api/admin/users/user-123', {
                method: 'PATCH',
                body: { active: false },
            })
            const res = await usersPATCH(req, { params: createMockParams({ id: 'user-123' }) })

            expect(res.status).toBe(404)
        })

        it('should update user active status', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'valid-session' }),
            })
                ; (validateAdminSession as jest.Mock).mockResolvedValue(mockAdmin)
                ; (prisma.user.update as jest.Mock).mockResolvedValue({
                    id: 'user-123',
                    email: 'user@example.com',
                    active: false,
                })

            const req = createMockRequest('http://localhost/api/admin/users/user-123', {
                method: 'PATCH',
                body: { active: false },
            })
            const res = await usersPATCH(req, { params: createMockParams({ id: 'user-123' }) })

            expect(res.status).toBe(200)
            expect(await res.json()).toEqual({
                id: 'user-123',
                email: 'user@example.com',
                active: false,
            })
        })

        it('should update user role', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'valid-session' }),
            })
                ; (validateAdminSession as jest.Mock).mockResolvedValue(mockAdmin)
                ; (prisma.user.update as jest.Mock).mockResolvedValue({
                    id: 'user-123',
                    role: 'ADMIN',
                })

            const req = createMockRequest('http://localhost/api/admin/users/user-123', {
                method: 'PATCH',
                body: { role: 'ADMIN' },
            })
            const res = await usersPATCH(req, { params: createMockParams({ id: 'user-123' }) })

            expect(res.status).toBe(200)
            const data = await res.json()
            expect(data.role).toBe('ADMIN')
        })
    })

    describe('GET /api/admin/links', () => {
        it('should return 401 if not authenticated', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue(null),
            })
                ; (validateAdminSession as jest.Mock).mockResolvedValue(null)

            const req = createMockRequest('http://localhost/api/admin/links')
            const res = await linksGET(req)

            expect(res.status).toBe(401)
        })

        it('should return paginated links', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'valid-session' }),
            })
                ; (validateAdminSession as jest.Mock).mockResolvedValue(mockAdmin)
                ; (prisma.link.count as jest.Mock).mockResolvedValue(100)
                ; (prisma.link.findMany as jest.Mock).mockResolvedValue([
                    {
                        id: 'link-1',
                        shortUrl: 'abc123',
                        longUrl: 'https://example.com/long-url-1',
                        User: { nimOrUsername: 'user1', email: 'user1@example.com' },
                    },
                    {
                        id: 'link-2',
                        shortUrl: 'xyz789',
                        longUrl: 'https://example.com/long-url-2',
                        User: { nimOrUsername: 'user2', email: 'user2@example.com' },
                    },
                ])

            const req = createMockRequest('http://localhost/api/admin/links')
            const res = await linksGET(req)

            expect(res.status).toBe(200)
            const data = await res.json()
            expect(data.links).toHaveLength(2)
            expect(data.pagination.total).toBe(100)
        })

        it('should filter by search query', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'valid-session' }),
            })
                ; (validateAdminSession as jest.Mock).mockResolvedValue(mockAdmin)
                ; (prisma.link.count as jest.Mock).mockResolvedValue(1)
                ; (prisma.link.findMany as jest.Mock).mockResolvedValue([])

            const req = createMockRequest('http://localhost/api/admin/links?search=testlink')
            await linksGET(req)

            expect(prisma.link.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            expect.objectContaining({ shortUrl: expect.objectContaining({ contains: 'testlink' }) })
                        ])
                    })
                })
            )
        })

        it('should filter by active status', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'valid-session' }),
            })
                ; (validateAdminSession as jest.Mock).mockResolvedValue(mockAdmin)
                ; (prisma.link.count as jest.Mock).mockResolvedValue(5)
                ; (prisma.link.findMany as jest.Mock).mockResolvedValue([])

            const req = createMockRequest('http://localhost/api/admin/links?active=true')
            await linksGET(req)

            expect(prisma.link.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        active: true
                    })
                })
            )
        })
    })

    describe('POST /api/verify-link-password', () => {
        beforeEach(() => {
            // Mock rate limit to allow requests
            ; (prisma.rateLimit.findUnique as jest.Mock).mockResolvedValue(null)
        })

        it('should return error if password is missing', async () => {
            const req = createMockRequest('http://localhost/api/verify-link-password', {
                method: 'POST',
                body: { shortUrl: 'abc123' },
            })
            const res = await verifyPasswordPOST(req)

            expect(res.status).toBe(401)
            expect(await res.json()).toEqual({ error: 'Verifikasi gagal.' })
        })

        it('should return error if link is not found', async () => {
            ; (prisma.link.findUnique as jest.Mock).mockResolvedValue(null)
                ; (bcrypt.hash as jest.Mock).mockResolvedValue('dummy_hash')
                ; (bcrypt.compare as jest.Mock).mockResolvedValue(false)

            const req = createMockRequest('http://localhost/api/verify-link-password', {
                method: 'POST',
                body: { shortUrl: 'abc123', password: 'test123' },
            })
            const res = await verifyPasswordPOST(req)

            expect(res.status).toBe(401)
            expect(await res.json()).toEqual({ error: 'Verifikasi gagal.' })
        })

        it('should return false if link has no password', async () => {
            ; (prisma.link.findUnique as jest.Mock).mockResolvedValue({
                id: 'link-id',
                shortUrl: 'abc123',
                password: null,
            })
                ; (bcrypt.hash as jest.Mock).mockResolvedValue('dummy_hash')
                ; (bcrypt.compare as jest.Mock).mockResolvedValue(false)

            const req = createMockRequest('http://localhost/api/verify-link-password', {
                method: 'POST',
                body: { shortUrl: 'abc123', password: 'test123' },
            })
            const res = await verifyPasswordPOST(req)

            expect(res.status).toBe(401)
            expect(await res.json()).toEqual({ error: 'Verifikasi gagal.' })
        })

        it('should return false if password is incorrect', async () => {
            ; (prisma.link.findUnique as jest.Mock).mockResolvedValue({
                id: 'link-id',
                shortUrl: 'abc123',
                password: 'hashed-password',
            })
                ; (bcrypt.compare as jest.Mock).mockResolvedValue(false)

            const req = createMockRequest('http://localhost/api/verify-link-password', {
                method: 'POST',
                body: { shortUrl: 'abc123', password: 'wrong-password' },
            })
            const res = await verifyPasswordPOST(req)

            expect(res.status).toBe(401)
            expect(await res.json()).toEqual({ error: 'Verifikasi gagal.' })
        })

        it('should return true if password is correct', async () => {
            ; (prisma.link.findUnique as jest.Mock).mockResolvedValue({
                id: 'link-id',
                shortUrl: 'abc123',
                password: 'hashed-password',
            })
                ; (bcrypt.compare as jest.Mock).mockResolvedValue(true)

            const req = createMockRequest('http://localhost/api/verify-link-password', {
                method: 'POST',
                body: { shortUrl: 'abc123', password: 'correct-password' },
            })
            const res = await verifyPasswordPOST(req)

            expect(res.status).toBe(200)
            expect(await res.json()).toEqual({ success: true })
        })
    })
})
