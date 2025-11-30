/**
 * @jest-environment node
 */
import {
    generateSessionToken,
    hashSessionToken,
    createAdminSession,
    validateAdminSession,
    extendSessionActivity,
    revokeAdminSession,
    revokeAllAdminSessions,
    revokeAdminSessionById,
    cleanupExpiredSessions,
    getAdminSessions,
} from '../admin-auth'
import { prisma } from '../prisma'
import { NextRequest } from 'next/server'
import { futureDate, pastDate } from '@/__tests__/test-utils'
import { TEST_TOKEN, TEST_INVALID_TOKEN } from '@/__tests__/test-constants'

// Mock prisma
jest.mock('../prisma', () => ({
    prisma: {
        adminSession: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
            deleteMany: jest.fn(),
        },
        admin: {
            update: jest.fn(),
        },
    },
}))

describe('Admin Auth', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('generateSessionToken', () => {
        it('should return 64-character hex string', () => {
            const token = generateSessionToken()

            expect(token).toHaveLength(64)
            expect(token).toMatch(/^[0-9a-f]{64}$/)
        })

        it('should generate unique tokens', () => {
            const token1 = generateSessionToken()
            const token2 = generateSessionToken()

            expect(token1).not.toBe(token2)
        })
    })

    describe('hashSessionToken', () => {
        it('should return SHA-256 hash', () => {
            const token = 'test-token'
            const hash = hashSessionToken(token)

            expect(hash).toHaveLength(64)
            expect(hash).toMatch(/^[0-9a-f]{64}$/)
        })

        it('should be consistent for same input', () => {
            const token = TEST_TOKEN
            const hash1 = hashSessionToken(token)
            const hash2 = hashSessionToken(token)

            expect(hash1).toBe(hash2)
        })

        it('should be different for different inputs', () => {
            const hash1 = hashSessionToken(TEST_TOKEN)
            const hash2 = hashSessionToken(TEST_INVALID_TOKEN)

            expect(hash1).not.toBe(hash2)
        })
    })

    describe('createAdminSession', () => {
        it('should create session with all fields', async () => {
            const mockReq = new NextRequest('https://admin.uper.li/login', {
                headers: {
                    'x-forwarded-for': '192.168.1.1',
                    'user-agent': 'Mozilla/5.0',
                },
            })

            const mockSession = {
                id: 'session-1',
                adminId: 'admin-123',
                token: 'hashed-token',
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
                expiresAt: futureDate(720), // 12 hours
                lastActivityAt: new Date(),
                createdAt: new Date(),
                revokedAt: null,
            }

                ; (prisma.adminSession.create as jest.Mock).mockResolvedValue(mockSession)
                ; (prisma.admin.update as jest.Mock).mockResolvedValue({})

            const result = await createAdminSession('admin-123', mockReq)

            expect(result.session).toEqual(mockSession)
            expect(result.token).toHaveLength(64)
            expect(prisma.adminSession.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        adminId: 'admin-123',
                        ipAddress: '192.168.1.1',
                        userAgent: 'Mozilla/5.0',
                    }),
                })
            )
        })

        it('should hash token before storing', async () => {
            ; (prisma.adminSession.create as jest.Mock).mockResolvedValue({})
                ; (prisma.admin.update as jest.Mock).mockResolvedValue({})

            const result = await createAdminSession('admin-123')

            const createCall = (prisma.adminSession.create as jest.Mock).mock.calls[0][0]
            const storedToken = createCall.data.token

            // Stored token should be hashed (64 char hex)
            expect(storedToken).toHaveLength(64)
            expect(storedToken).toMatch(/^[0-9a-f]{64}$/)
            // Returned token should be different (plain token)
            expect(result.token).not.toBe(storedToken)
        })

        it('should set expiration correctly', async () => {
            const beforeCreate = new Date()
                ; (prisma.adminSession.create as jest.Mock).mockResolvedValue({})
                ; (prisma.admin.update as jest.Mock).mockResolvedValue({})

            await createAdminSession('admin-123')

            const createCall = (prisma.adminSession.create as jest.Mock).mock.calls[0][0]
            const expiresAt = createCall.data.expiresAt

            // Should expire in ~12 hours (allow some variance)
            const expectedExpiry = new Date(beforeCreate.getTime() + 12 * 60 * 60 * 1000)
            const timeDiff = Math.abs(expiresAt.getTime() - expectedExpiry.getTime())
            expect(timeDiff).toBeLessThan(1000) // Within 1 second
        })

        it('should update admin lastLoginAt', async () => {
            ; (prisma.adminSession.create as jest.Mock).mockResolvedValue({})
                ; (prisma.admin.update as jest.Mock).mockResolvedValue({})

            await createAdminSession('admin-123')

            expect(prisma.admin.update).toHaveBeenCalledWith({
                where: { id: 'admin-123' },
                data: expect.objectContaining({
                    lastLoginAt: expect.any(Date),
                }),
            })
        })

        it('should work without request object', async () => {
            ; (prisma.adminSession.create as jest.Mock).mockResolvedValue({})
                ; (prisma.admin.update as jest.Mock).mockResolvedValue({})

            await createAdminSession('admin-123')

            const createCall = (prisma.adminSession.create as jest.Mock).mock.calls[0][0]
            expect(createCall.data.ipAddress).toBeUndefined()
            expect(createCall.data.userAgent).toBeUndefined()
        })
    })

    describe('validateAdminSession', () => {
        it('should return null for invalid token', async () => {
            const result = await validateAdminSession(null)
            expect(result).toBeNull()
        })

        it('should return null for missing token', async () => {
            const result = await validateAdminSession(undefined)
            expect(result).toBeNull()
        })

        it('should return admin for valid token', async () => {
            const mockAdmin = {
                id: 'admin-123',
                email: 'admin@example.com',
                name: 'Admin User',
                active: true,
            }

            const mockSession = {
                id: 'session-1',
                adminId: 'admin-123',
                token: hashSessionToken(TEST_TOKEN),
                expiresAt: futureDate(600),
                lastActivityAt: new Date(),
                revokedAt: null,
                admin: mockAdmin,
            }

                ; (prisma.adminSession.findUnique as jest.Mock).mockResolvedValue(mockSession)

            const result = await validateAdminSession(TEST_TOKEN)

            expect(result).toEqual(mockAdmin)
        })

        it('should return null for revoked session', async () => {
            const mockSession = {
                id: 'session-1',
                revokedAt: new Date(),
                admin: { id: 'admin-123', active: true },
            }

                ; (prisma.adminSession.findUnique as jest.Mock).mockResolvedValue(mockSession)

            const result = await validateAdminSession(TEST_INVALID_TOKEN)

            expect(result).toBeNull()
        })

        it('should return null for expired session', async () => {
            const mockSession = {
                id: 'session-1',
                expiresAt: pastDate(10),
                lastActivityAt: new Date(),
                revokedAt: null,
                admin: { id: 'admin-123', active: true },
            }

                ; (prisma.adminSession.findUnique as jest.Mock).mockResolvedValue(mockSession)
                ; (prisma.adminSession.update as jest.Mock).mockResolvedValue({})

            const result = await validateAdminSession(TEST_INVALID_TOKEN)

            expect(result).toBeNull()
            // Should mark as revoked
            expect(prisma.adminSession.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        revokedAt: expect.any(Date),
                    }),
                })
            )
        })

        it('should return null for inactive session', async () => {
            const mockSession = {
                id: 'session-1',
                expiresAt: futureDate(600),
                lastActivityAt: pastDate(35), // 35 minutes ago (> 30 min timeout)
                revokedAt: null,
                admin: { id: 'admin-123', active: true },
            }

                ; (prisma.adminSession.findUnique as jest.Mock).mockResolvedValue(mockSession)
                ; (prisma.adminSession.update as jest.Mock).mockResolvedValue({})

            const result = await validateAdminSession(TEST_INVALID_TOKEN)

            expect(result).toBeNull()
            // Should mark as revoked
            expect(prisma.adminSession.update).toHaveBeenCalled()
        })

        it('should return null for inactive admin account', async () => {
            const mockSession = {
                id: 'session-1',
                expiresAt: futureDate(600),
                lastActivityAt: new Date(),
                revokedAt: null,
                admin: { id: 'admin-123', active: false },
            }

                ; (prisma.adminSession.findUnique as jest.Mock).mockResolvedValue(mockSession)

            const result = await validateAdminSession(TEST_TOKEN)

            expect(result).toBeNull()
        })
    })

    describe('extendSessionActivity', () => {
        it('should update lastActivityAt', async () => {
            ; (prisma.adminSession.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

            await extendSessionActivity(TEST_TOKEN)

            expect(prisma.adminSession.updateMany).toHaveBeenCalledWith({
                where: {
                    token: hashSessionToken(TEST_TOKEN),
                    revokedAt: null,
                },
                data: {
                    lastActivityAt: expect.any(Date),
                },
            })
        })

        it('should not update revoked sessions', async () => {
            ; (prisma.adminSession.updateMany as jest.Mock).mockResolvedValue({ count: 0 })

            await extendSessionActivity(TEST_INVALID_TOKEN)

            const updateCall = (prisma.adminSession.updateMany as jest.Mock).mock.calls[0][0]
            expect(updateCall.where.revokedAt).toBeNull()
        })
    })

    describe('revokeAdminSession', () => {
        it('should mark session as revoked', async () => {
            ; (prisma.adminSession.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

            await revokeAdminSession(TEST_TOKEN)

            expect(prisma.adminSession.updateMany).toHaveBeenCalledWith({
                where: { token: hashSessionToken(TEST_TOKEN) },
                data: { revokedAt: expect.any(Date) },
            })
        })
    })

    describe('revokeAllAdminSessions', () => {
        it('should revoke all active sessions for admin', async () => {
            ; (prisma.adminSession.updateMany as jest.Mock).mockResolvedValue({ count: 3 })

            const count = await revokeAllAdminSessions('admin-123')

            expect(count).toBe(3)
            expect(prisma.adminSession.updateMany).toHaveBeenCalledWith({
                where: {
                    adminId: 'admin-123',
                    revokedAt: null,
                },
                data: {
                    revokedAt: expect.any(Date),
                },
            })
        })

        it('should not revoke already revoked sessions', async () => {
            ; (prisma.adminSession.updateMany as jest.Mock).mockResolvedValue({ count: 0 })

            await revokeAllAdminSessions('admin-123')

            const updateCall = (prisma.adminSession.updateMany as jest.Mock).mock.calls[0][0]
            expect(updateCall.where.revokedAt).toBeNull()
        })

        it('should return count of revoked sessions', async () => {
            ; (prisma.adminSession.updateMany as jest.Mock).mockResolvedValue({ count: 5 })

            const count = await revokeAllAdminSessions('admin-123')

            expect(count).toBe(5)
        })
    })

    describe('revokeAdminSessionById', () => {
        it('should revoke specific session', async () => {
            ; (prisma.adminSession.update as jest.Mock).mockResolvedValue({})

            await revokeAdminSessionById('session-123')

            expect(prisma.adminSession.update).toHaveBeenCalledWith({
                where: { id: 'session-123' },
                data: { revokedAt: expect.any(Date) },
            })
        })
    })

    describe('cleanupExpiredSessions', () => {
        it('should delete expired sessions', async () => {
            ; (prisma.adminSession.deleteMany as jest.Mock).mockResolvedValue({ count: 10 })

            const count = await cleanupExpiredSessions()

            expect(count).toBe(10)
            expect(prisma.adminSession.deleteMany).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { expiresAt: { lt: expect.any(Date) } },
                        {
                            AND: [
                                { revokedAt: { not: null } },
                                { revokedAt: { lt: expect.any(Date) } },
                            ],
                        },
                    ],
                },
            })
        })

        it('should delete old revoked sessions', async () => {
            ; (prisma.adminSession.deleteMany as jest.Mock).mockResolvedValue({ count: 5 })

            await cleanupExpiredSessions()

            const deleteCall = (prisma.adminSession.deleteMany as jest.Mock).mock.calls[0][0]
            // Check that it deletes revoked sessions older than 7 days
            const revokedCondition = deleteCall.where.OR[1].AND[1]
            expect(revokedCondition.revokedAt.lt).toBeInstanceOf(Date)
        })

        it('should return count deleted', async () => {
            ; (prisma.adminSession.deleteMany as jest.Mock).mockResolvedValue({ count: 15 })

            const count = await cleanupExpiredSessions()

            expect(count).toBe(15)
        })
    })

    describe('getAdminSessions', () => {
        it('should return only active sessions', async () => {
            const mockSessions = [
                {
                    id: 'session-1',
                    ipAddress: '192.168.1.1',
                    userAgent: 'Mozilla/5.0',
                    createdAt: new Date('2023-01-01'),
                    lastActivityAt: new Date(),
                    expiresAt: futureDate(600),
                },
            ]

                ; (prisma.adminSession.findMany as jest.Mock).mockResolvedValue(mockSessions)

            const result = await getAdminSessions('admin-123')

            expect(result).toEqual(mockSessions)
            expect(prisma.adminSession.findMany).toHaveBeenCalledWith({
                where: {
                    adminId: 'admin-123',
                    revokedAt: null,
                    expiresAt: { gt: expect.any(Date) },
                },
                orderBy: { lastActivityAt: 'desc' },
                select: {
                    id: true,
                    ipAddress: true,
                    userAgent: true,
                    createdAt: true,
                    lastActivityAt: true,
                    expiresAt: true,
                },
            })
        })

        it('should order by lastActivityAt desc', async () => {
            ; (prisma.adminSession.findMany as jest.Mock).mockResolvedValue([])

            await getAdminSessions('admin-123')

            const findCall = (prisma.adminSession.findMany as jest.Mock).mock.calls[0][0]
            expect(findCall.orderBy).toEqual({ lastActivityAt: 'desc' })
        })

        it('should include all required fields', async () => {
            ; (prisma.adminSession.findMany as jest.Mock).mockResolvedValue([])

            await getAdminSessions('admin-123')

            const findCall = (prisma.adminSession.findMany as jest.Mock).mock.calls[0][0]
            expect(findCall.select).toEqual({
                id: true,
                ipAddress: true,
                userAgent: true,
                createdAt: true,
                lastActivityAt: true,
                expiresAt: true,
            })
        })
    })
})
