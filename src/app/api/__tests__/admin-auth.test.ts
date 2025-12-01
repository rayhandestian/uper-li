/**
 * @jest-environment node
 */
import { POST as loginPOST } from '../admin/auth/login/route'
import { POST as logoutPOST } from '../admin/auth/logout/route'
import { POST as verify2faPOST } from '../admin/auth/verify-2fa/route'
import { GET as sessionsGET } from '../admin/auth/sessions/route'
import { DELETE as sessionDELETE } from '../admin/auth/session/[id]/route'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import {
    createMockRequest,
    createMockParams,
    setupMockAdminAuth,
    setupMockUnauthenticated,
    expectJsonResponse,
} from '@/__tests__/test-utils'
import { TEST_HASHED_PASSWORD, TEST_PASSWORD, TEST_WRONG_PASSWORD } from '@/__tests__/test-constants'

// Mock dependencies
jest.mock('next/headers', () => ({
    cookies: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
    prisma: {
        admin: {
            findUnique: jest.fn(),
            update: jest.fn(),
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
    createAdminSession: jest.fn(),
    validateAdminSession: jest.fn(),
    revokeAdminSession: jest.fn(),
    revokeAdminSessionById: jest.fn(),
    getAdminSessions: jest.fn(),
    hashSessionToken: jest.fn(),
}))

jest.mock('@/lib/admin-verification', () => ({
    recordFailedAttempt: jest.fn(),
    recordSuccessfulAttempt: jest.fn(),
    isAccountLocked: jest.fn(),
}))

jest.mock('@/lib/admin-audit', () => ({
    logAdminAction: jest.fn(),
    AUDIT_ACTIONS: {
        LOGIN_SUCCESS: 'LOGIN_SUCCESS',
        LOGIN_FAILED: 'LOGIN_FAILED',
        LOGIN_LOCKED: 'LOGIN_LOCKED',
        LOGOUT: 'LOGOUT',
        SESSION_REVOKED: 'SESSION_REVOKED',
    },
}))

jest.mock('@/lib/email', () => ({
    sendEmail: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
    },
}))

jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}))

jest.mock('node:crypto', () => ({
    randomInt: jest.fn(),
}))

jest.mock('@/lib/rateLimit', () => ({
    withRateLimit: (handler: unknown) => handler,
}))

// Mock global fetch for Turnstile
global.fetch = jest.fn()

import { cookies } from 'next/headers'
import { createAdminSession, validateAdminSession, getAdminSessions, hashSessionToken } from '@/lib/admin-auth'
import { isAccountLocked } from '@/lib/admin-verification'

describe('Admin Auth API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        process.env.CLOUDFLARE_TURNSTILE_SECRET = 'test-secret'
    })

    describe('POST /api/admin/auth/login', () => {
        it('should return 400 if email or password missing', async () => {
            const req = createMockRequest('http://localhost/api/admin/auth/login', {
                method: 'POST',
                body: { email: 'test@example.com' }, // Missing password
            })
            const res = await loginPOST(req)
            await expectJsonResponse(res, 400, { error: 'Email and password are required' })
        })

        it('should return 400 if Turnstile verification fails', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ success: false }),
            })

            const req = createMockRequest('http://localhost/api/admin/auth/login', {
                method: 'POST',
                body: { email: 'test@example.com', password: 'password', turnstileToken: 'invalid' },
            })
            const res = await loginPOST(req)
            await expectJsonResponse(res, 400, { error: 'CAPTCHA verification failed.' })
        })

        it('should return 401 if admin not found', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ success: true }),
            })
                ; (prisma.admin.findUnique as jest.Mock).mockResolvedValue(null)

            const req = createMockRequest('http://localhost/api/admin/auth/login', {
                method: 'POST',
                body: { email: 'test@example.com', password: 'password', turnstileToken: 'valid' },
            })
            const res = await loginPOST(req)
            await expectJsonResponse(res, 401, { error: 'Invalid credentials' })
        })

        it('should return 403 if account is inactive', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ success: true }),
            })
                ; (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
                    id: 'admin-1',
                    active: false,
                })

            const req = createMockRequest('http://localhost/api/admin/auth/login', {
                method: 'POST',
                body: { email: 'test@example.com', password: 'password', turnstileToken: 'valid' },
            })
            const res = await loginPOST(req)
            await expectJsonResponse(res, 403, { error: 'Account is deactivated' })
        })

        it('should return 429 if account is locked', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ success: true }),
            })
                ; (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
                    id: 'admin-1',
                    active: true,
                })
                ; (isAccountLocked as jest.Mock).mockResolvedValue({
                    locked: true,
                    lockoutEndsAt: new Date(Date.now() + 15 * 60 * 1000),
                })

            const req = createMockRequest('http://localhost/api/admin/auth/login', {
                method: 'POST',
                body: { email: 'test@example.com', password: 'password', turnstileToken: 'valid' },
            })
            const res = await loginPOST(req)
            expect(res.status).toBe(429)
        })

        it('should return 401 if password invalid', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ success: true }),
            })
                ; (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
                    id: 'admin-1',
                    active: true,
                    password: TEST_HASHED_PASSWORD,
                })
                ; (isAccountLocked as jest.Mock).mockResolvedValue({ locked: false })
                ; (bcrypt.compare as jest.Mock).mockResolvedValue(false)

            const req = createMockRequest('http://localhost/api/admin/auth/login', {
                method: 'POST',
                body: { email: 'test@example.com', password: TEST_WRONG_PASSWORD, turnstileToken: 'valid' },
            })
            const res = await loginPOST(req)
            await expectJsonResponse(res, 401, { error: 'Invalid credentials' })
        })

        it('should return 200 and set cookie on success (no 2FA)', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ success: true }),
            })
                ; (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
                    id: 'admin-1',
                    active: true,
                    password: TEST_HASHED_PASSWORD,
                    twoFactorEnabled: false,
                })
                ; (isAccountLocked as jest.Mock).mockResolvedValue({ locked: false })
                ; (bcrypt.compare as jest.Mock).mockResolvedValue(true)
                ; (createAdminSession as jest.Mock).mockResolvedValue({
                    session: { id: 'session-1' },
                    token: 'session-token',
                })

            const req = createMockRequest('http://localhost/api/admin/auth/login', {
                method: 'POST',
                body: { email: 'test@example.com', password: TEST_PASSWORD, turnstileToken: 'valid' },
            })
            const res = await loginPOST(req)

            expect(res.status).toBe(200)
            expect(res.cookies.get('admin_session')).toBeDefined()
        })

        it('should return 200 and require 2FA if enabled', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ success: true }),
            })
                ; (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
                    id: 'admin-1',
                    active: true,
                    password: TEST_HASHED_PASSWORD,
                    twoFactorEnabled: true,
                    email: 'test@example.com',
                    name: 'Admin',
                })
                ; (isAccountLocked as jest.Mock).mockResolvedValue({ locked: false })
                ; (bcrypt.compare as jest.Mock).mockResolvedValue(true)
                ; (crypto.randomInt as jest.Mock).mockReturnValue(123456)

            const req = createMockRequest('http://localhost/api/admin/auth/login', {
                method: 'POST',
                body: { email: 'test@example.com', password: TEST_PASSWORD, turnstileToken: 'valid' },
            })
            const res = await loginPOST(req)

            await expectJsonResponse(res, 200, {
                requires2FA: true,
                email: 'test@example.com',
            })
            expect(prisma.admin.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ twoFactorSecret: '123456' })
            }))
        })
    })

    describe('POST /api/admin/auth/verify-2fa', () => {
        it('should return 400 if email or code missing', async () => {
            const req = createMockRequest('http://localhost/api/admin/auth/verify-2fa', {
                method: 'POST',
                body: { email: 'test@example.com' },
            })
            const res = await verify2faPOST(req)
            await expectJsonResponse(res, 400, { error: 'Email and code are required' })
        })

        it('should return 400 if admin not found', async () => {
            ; (prisma.admin.findUnique as jest.Mock).mockResolvedValue(null)
            const req = createMockRequest('http://localhost/api/admin/auth/verify-2fa', {
                method: 'POST',
                body: { email: 'test@example.com', code: '123456' },
            })
            const res = await verify2faPOST(req)
            await expectJsonResponse(res, 400, { error: 'Invalid request' })
        })

        it('should return 429 if account locked', async () => {
            ; (prisma.admin.findUnique as jest.Mock).mockResolvedValue({ id: 'admin-1' })
                ; (isAccountLocked as jest.Mock).mockResolvedValue({ locked: true })

            const req = createMockRequest('http://localhost/api/admin/auth/verify-2fa', {
                method: 'POST',
                body: { email: 'test@example.com', code: '123456' },
            })
            const res = await verify2faPOST(req)
            expect(res.status).toBe(429)
        })

        it('should return 400 if no 2FA code found', async () => {
            ; (prisma.admin.findUnique as jest.Mock).mockResolvedValue({ id: 'admin-1', twoFactorSecret: null })
                ; (isAccountLocked as jest.Mock).mockResolvedValue({ locked: false })

            const req = createMockRequest('http://localhost/api/admin/auth/verify-2fa', {
                method: 'POST',
                body: { email: 'test@example.com', code: '123456' },
            })
            const res = await verify2faPOST(req)
            await expectJsonResponse(res, 400, { error: 'No 2FA code found. Please login again.' })
        })

        it('should return 400 if code expired', async () => {
            ; (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
                id: 'admin-1',
                twoFactorSecret: '123456',
                updatedAt: new Date(Date.now() - 1000), // Expired
            })
                ; (isAccountLocked as jest.Mock).mockResolvedValue({ locked: false })

            const req = createMockRequest('http://localhost/api/admin/auth/verify-2fa', {
                method: 'POST',
                body: { email: 'test@example.com', code: '123456' },
            })
            const res = await verify2faPOST(req)
            await expectJsonResponse(res, 400, { error: '2FA code has expired. Please login again.' })
        })

        it('should return 401 if code invalid', async () => {
            ; (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
                id: 'admin-1',
                twoFactorSecret: '654321',
                updatedAt: new Date(Date.now() + 10000),
            })
                ; (isAccountLocked as jest.Mock).mockResolvedValue({ locked: false })

            const req = createMockRequest('http://localhost/api/admin/auth/verify-2fa', {
                method: 'POST',
                body: { email: 'test@example.com', code: '123456' },
            })
            const res = await verify2faPOST(req)
            await expectJsonResponse(res, 401, { error: 'Invalid 2FA code' })
        })

        it('should return 200 and set cookie on success', async () => {
            ; (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
                id: 'admin-1',
                twoFactorSecret: '123456',
                updatedAt: new Date(Date.now() + 10000),
            })
                ; (isAccountLocked as jest.Mock).mockResolvedValue({ locked: false })
                ; (createAdminSession as jest.Mock).mockResolvedValue({
                    session: { id: 'session-1' },
                    token: 'session-token',
                })

            const req = createMockRequest('http://localhost/api/admin/auth/verify-2fa', {
                method: 'POST',
                body: { email: 'test@example.com', code: '123456' },
            })
            const res = await verify2faPOST(req)

            expect(res.status).toBe(200)
            expect(res.cookies.get('admin_session')).toBeDefined()
        })
    })

    describe('POST /api/admin/auth/logout', () => {
        it('should revoke session and clear cookie', async () => {
            setupMockAdminAuth(cookies as jest.Mock, validateAdminSession as jest.Mock)

            const req = createMockRequest('http://localhost/api/admin/auth/logout', { method: 'POST' })
            const res = await logoutPOST(req)

            expect(res.status).toBe(307) // Redirect
            const cookie = res.cookies.get('admin_session')
            // Cookie should be cleared (empty value or expired)
            if (cookie) {
                expect(cookie.value).toBe('')
            }
        })
    })

    describe('GET /api/admin/auth/sessions', () => {
        it('should return 401 if unauthorized', async () => {
            setupMockUnauthenticated(cookies as jest.Mock, validateAdminSession as jest.Mock)
            const req = createMockRequest('http://localhost/api/admin/auth/sessions')
            const res = await sessionsGET()
            await expectJsonResponse(res, 401, { error: 'Unauthorized' })
        })

        it('should return sessions list', async () => {
            setupMockAdminAuth(cookies as jest.Mock, validateAdminSession as jest.Mock)
                ; (getAdminSessions as jest.Mock).mockResolvedValue([
                    { id: 'session-1', userAgent: 'Chrome' },
                    { id: 'session-2', userAgent: 'Firefox' },
                ])
                ; (hashSessionToken as jest.Mock).mockReturnValue('session-1')

            const req = createMockRequest('http://localhost/api/admin/auth/sessions')
            const res = await sessionsGET()

            const data = await res.json()
            expect(data.sessions).toHaveLength(2)
            expect(data.sessions[0].current).toBe(true)
            expect(data.sessions[1].current).toBe(false)
        })
    })

    describe('DELETE /api/admin/auth/session/[id]', () => {
        it('should return 401 if unauthorized', async () => {
            setupMockUnauthenticated(cookies as jest.Mock, validateAdminSession as jest.Mock)
            const req = createMockRequest('http://localhost/api/admin/auth/session/session-123', { method: 'DELETE' })
            const res = await sessionDELETE(req, { params: createMockParams({ id: 'session-123' }) })
            await expectJsonResponse(res, 401, { error: 'Unauthorized' })
        })

        it('should revoke session', async () => {
            setupMockAdminAuth(cookies as jest.Mock, validateAdminSession as jest.Mock)
            const req = createMockRequest('http://localhost/api/admin/auth/session/session-123', { method: 'DELETE' })
            const res = await sessionDELETE(req, { params: createMockParams({ id: 'session-123' }) })

            await expectJsonResponse(res, 200, { success: true })
        })
    })
})
