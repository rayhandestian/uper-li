/**
 * @jest-environment node
 */
import { GET as usersGET } from '../admin/users/route'
import { PATCH as usersPATCH } from '../admin/users/[id]/route'
import { GET as linksGET } from '../admin/links/route'
import { POST as verifyPasswordPOST } from '../verify-link-password/route'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import {
    createMockRequest,
    createMockParams,
    mockDbSuccess,
    mockDbEmpty,
} from '@/__tests__/test-utils'

// Mock dependencies
jest.mock('next/headers', () => ({
    cookies: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
    db: {
        query: jest.fn(),
    },
}))

jest.mock('@/lib/admin-auth', () => ({
    verifyAdminToken: jest.fn(),
}))

jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
}))

import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/admin-auth'

describe('Admin & Additional Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('GET /api/admin/users', () => {
        it('should return 403 if not authenticated', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue(null),
            })

            const req = createMockRequest('http://localhost/api/admin/users')
            const res = await usersGET(req)

            expect(res.status).toBe(403)
            expect(await res.json()).toEqual({ error: 'Unauthorized' })
        })

        it('should return 403 if token invalid', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'invalid-token' }),
            })
                ; (verifyAdminToken as jest.Mock).mockReturnValue(false)

            const req = createMockRequest('http://localhost/api/admin/users')
            const res = await usersGET(req)

            expect(res.status).toBe(403)
        })

        it('should return paginated users', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'valid-token' }),
            })
                ; (verifyAdminToken as jest.Mock).mockReturnValue(true)
                ; (db.query as jest.Mock)
                    .mockResolvedValueOnce(mockDbSuccess([{ total: '50' }])) // COUNT
                    .mockResolvedValueOnce(
                        mockDbSuccess([
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
                    )

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
                get: jest.fn().mockReturnValue({ value: 'valid-token' }),
            })
                ; (verifyAdminToken as jest.Mock).mockReturnValue(true)
                ; (db.query as jest.Mock)
                    .mockResolvedValueOnce(mockDbSuccess([{ total: '1' }]))
                    .mockResolvedValueOnce(mockDbSuccess([{ id: 'user-1', nimOrUsername: 'testuser' }]))

            const req = createMockRequest('http://localhost/api/admin/users?search=testuser')
            await usersGET(req)

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('ILIKE'),
                expect.arrayContaining(['%testuser%'])
            )
        })

        it('should filter by role', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'valid-token' }),
            })
                ; (verifyAdminToken as jest.Mock).mockReturnValue(true)
                ; (db.query as jest.Mock)
                    .mockResolvedValueOnce(mockDbSuccess([{ total: '5' }]))
                    .mockResolvedValueOnce(mockDbSuccess([]))

            const req = createMockRequest('http://localhost/api/admin/users?role=ADMIN')
            await usersGET(req)

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('role ='),
                expect.arrayContaining(['ADMIN'])
            )
        })
    })

    describe('PATCH /api/admin/users/[id]', () => {
        it('should return 403 if not authenticated', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue(null),
            })

            const req = createMockRequest('http://localhost/api/admin/users/user-123', {
                method: 'PATCH',
                body: { active: false },
            })
            const res = await usersPATCH(req, { params: createMockParams({ id: 'user-123' }) })

            expect(res.status).toBe(403)
        })

        it('should return 400 if no fields to update', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'valid-token' }),
            })
                ; (verifyAdminToken as jest.Mock).mockReturnValue(true)

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
                get: jest.fn().mockReturnValue({ value: 'valid-token' }),
            })
                ; (verifyAdminToken as jest.Mock).mockReturnValue(true)
                ; (db.query as jest.Mock).mockResolvedValue(mockDbEmpty())

            const req = createMockRequest('http://localhost/api/admin/users/user-123', {
                method: 'PATCH',
                body: { active: false },
            })
            const res = await usersPATCH(req, { params: createMockParams({ id: 'user-123' }) })

            expect(res.status).toBe(404)
        })

        it('should update user active status', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'valid-token' }),
            })
                ; (verifyAdminToken as jest.Mock).mockReturnValue(true)
                ; (db.query as jest.Mock).mockResolvedValue(
                    mockDbSuccess([{ id: 'user-123', active: false }])
                )

            const req = createMockRequest('http://localhost/api/admin/users/user-123', {
                method: 'PATCH',
                body: { active: false },
            })
            const res = await usersPATCH(req, { params: createMockParams({ id: 'user-123' }) })

            expect(res.status).toBe(200)
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE'),
                expect.arrayContaining([false, 'user-123'])
            )
        })

        it('should update user role', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'valid-token' }),
            })
                ; (verifyAdminToken as jest.Mock).mockReturnValue(true)
                ; (db.query as jest.Mock).mockResolvedValue(
                    mockDbSuccess([{ id: 'user-123', role: 'ADMIN' }])
                )

            const req = createMockRequest('http://localhost/api/admin/users/user-123', {
                method: 'PATCH',
                body: { role: 'ADMIN' },
            })
            const res = await usersPATCH(req, { params: createMockParams({ id: 'user-123' }) })

            expect(res.status).toBe(200)
        })
    })

    describe('GET /api/admin/links', () => {
        it('should return 403 if not authenticated', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue(null),
            })

            const req = createMockRequest('http://localhost/api/admin/links')
            const res = await linksGET(req)

            expect(res.status).toBe(403)
        })

        it('should return paginated links', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'valid-token' }),
            })
                ; (verifyAdminToken as jest.Mock).mockReturnValue(true)
                ; (db.query as jest.Mock)
                    .mockResolvedValueOnce(mockDbSuccess([{ total: '100' }]))
                    .mockResolvedValueOnce(
                        mockDbSuccess([
                            {
                                id: 'link-1',
                                shortUrl: 'abc123',
                                longUrl: 'http://example.com',
                                nimOrUsername: 'user1',
                                email: 'user1@example.com',
                            },
                        ])
                    )

            const req = createMockRequest('http://localhost/api/admin/links')
            const res = await linksGET(req)

            expect(res.status).toBe(200)
            const data = await res.json()
            expect(data.links).toHaveLength(1)
            expect(data.links[0].user).toBeDefined()
            expect(data.pagination.total).toBe(100)
        })

        it('should filter by active status', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'valid-token' }),
            })
                ; (verifyAdminToken as jest.Mock).mockReturnValue(true)
                ; (db.query as jest.Mock)
                    .mockResolvedValueOnce(mockDbSuccess([{ total: '10' }]))
                    .mockResolvedValueOnce(mockDbSuccess([]))

            const req = createMockRequest('http://localhost/api/admin/links?active=true')
            await linksGET(req)

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('l.active ='),
                expect.arrayContaining([true])
            )
        })
    })

    describe('POST /api/verify-link-password', () => {
        it('should return 400 if fields missing', async () => {
            const req = createMockRequest('http://localhost/api/verify-link-password', {
                method: 'POST',
                body: {},
            })
            const res = await verifyPasswordPOST(req)

            expect(res.status).toBe(400)
        })

        it('should return 404 if link not found', async () => {
            ; (db.query as jest.Mock).mockResolvedValue(mockDbEmpty())

            const req = createMockRequest('http://localhost/api/verify-link-password', {
                method: 'POST',
                body: { shortUrl: 'abc123', password: 'password' },
            })
            const res = await verifyPasswordPOST(req)

            expect(res.status).toBe(404)
        })

        it('should return 400 if link has no password', async () => {
            ; (db.query as jest.Mock).mockResolvedValue(
                mockDbSuccess([{ shortUrl: 'abc123', password: null }])
            )

            const req = createMockRequest('http://localhost/api/verify-link-password', {
                method: 'POST',
                body: { shortUrl: 'abc123', password: 'password' },
            })
            const res = await verifyPasswordPOST(req)

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Link ini tidak memerlukan password.' })
        })

        it('should return 401 if password incorrect', async () => {
            ; (db.query as jest.Mock).mockResolvedValue(
                mockDbSuccess([{ shortUrl: 'abc123', password: 'hashed-password' }])
            )
                ; (bcrypt.compare as jest.Mock).mockResolvedValue(false)

            const req = createMockRequest('http://localhost/api/verify-link-password', {
                method: 'POST',
                body: { shortUrl: 'abc123', password: 'wrong-password' },
            })
            const res = await verifyPasswordPOST(req)

            expect(res.status).toBe(401)
        })

        it('should return success if password correct', async () => {
            ; (db.query as jest.Mock).mockResolvedValue(
                mockDbSuccess([{ shortUrl: 'abc123', password: 'hashed-password' }])
            )
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
