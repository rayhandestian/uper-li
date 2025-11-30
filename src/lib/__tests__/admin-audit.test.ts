/**
 * @jest-environment node
 */
import { logAdminAction, getAdminAuditLogs, getRecentAuditLogs, getAuditLogActions, AUDIT_ACTIONS } from '../admin-audit'
import { prisma } from '../prisma'
import { createAdminUperLiRequest, createMockAdminLog } from '@/__tests__/test-utils'

// Mock prisma
jest.mock('../prisma', () => ({
    prisma: {
        adminAuditLog: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
    },
}))

describe('Admin Audit', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('logAdminAction', () => {
        it('should log action with all fields', async () => {
            const mockReq = createAdminUperLiRequest('/dashboard', {
                headers: {
                    'x-forwarded-for': '192.168.1.1',
                    'user-agent': 'Mozilla/5.0',
                },
            })

            const mockLog = createMockAdminLog({
                id: 'log-1',
                adminId: 'admin-123',
                action: 'USER_VIEW',
                resource: 'user-456',
                details: JSON.stringify({ field: 'email' }),
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
                success: true,
                createdAt: new Date(),
            })

                ; (prisma.adminAuditLog.create as jest.Mock).mockResolvedValue(mockLog)

            await logAdminAction({
                adminId: 'admin-123',
                action: 'USER_VIEW',
                resource: 'user-456',
                details: { field: 'email' },
                success: true,
                req: mockReq,
            })

            expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
                data: {
                    adminId: 'admin-123',
                    action: 'USER_VIEW',
                    resource: 'user-456',
                    details: JSON.stringify({ field: 'email' }),
                    ipAddress: '192.168.1.1',
                    userAgent: 'Mozilla/5.0',
                    success: true,
                },
            })
        })

        it('should log action without optional fields', async () => {
            ; (prisma.adminAuditLog.create as jest.Mock).mockResolvedValue({})

            await logAdminAction({
                action: 'LOGIN_SUCCESS',
            })

            expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
                data: {
                    adminId: null,
                    action: 'LOGIN_SUCCESS',
                    resource: null,
                    details: null,
                    ipAddress: undefined,
                    userAgent: undefined,
                    success: true,
                },
            })
        })

        it('should extract IP from x-forwarded-for header', async () => {
            const mockReq = createAdminUperLiRequest('/login', {
                headers: {
                    'x-forwarded-for': '10.0.0.1, 10.0.0.2',
                },
            })

                ; (prisma.adminAuditLog.create as jest.Mock).mockResolvedValue({})

            await logAdminAction({
                action: 'LOGIN_SUCCESS',
                req: mockReq,
            })

            expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        ipAddress: '10.0.0.1',
                    }),
                })
            )
        })

        it('should extract IP from x-real-ip header', async () => {
            const mockReq = createAdminUperLiRequest('/login', {
                headers: {
                    'x-real-ip': '172.16.0.1',
                },
            })

                ; (prisma.adminAuditLog.create as jest.Mock).mockResolvedValue({})

            await logAdminAction({
                action: 'LOGIN_SUCCESS',
                req: mockReq,
            })

            expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        ipAddress: '172.16.0.1',
                    }),
                })
            )
        })

        it('should handle missing IP and user agent', async () => {
            const mockReq = createAdminUperLiRequest('/login')

                ; (prisma.adminAuditLog.create as jest.Mock).mockResolvedValue({})

            await logAdminAction({
                action: 'LOGIN_SUCCESS',
                req: mockReq,
            })

            expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        ipAddress: undefined,
                        userAgent: undefined,
                    }),
                })
            )
        })

        it('should log failed actions', async () => {
            ; (prisma.adminAuditLog.create as jest.Mock).mockResolvedValue({})

            await logAdminAction({
                adminId: 'admin-123',
                action: 'LOGIN_FAILED',
                success: false,
            })

            expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        success: false,
                    }),
                })
            )
        })
    })

    describe('getAdminAuditLogs', () => {
        it('should return recent logs for admin', async () => {
            const mockLogs = [
                createMockAdminLog({
                    id: 'log-1',
                    action: 'USER_VIEW',
                    resource: 'user-1',
                    details: null,
                    ipAddress: '192.168.1.1',
                    success: true,
                    createdAt: new Date('2023-01-02'),
                }),
                createMockAdminLog({
                    id: 'log-2',
                    action: 'LOGIN_SUCCESS',
                    resource: null,
                    details: null,
                    ipAddress: '192.168.1.1',
                    success: true,
                    createdAt: new Date('2023-01-01'),
                }),
            ]

                ; (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue(mockLogs)

            const result = await getAdminAuditLogs('admin-123')

            expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith({
                where: { adminId: 'admin-123' },
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: {
                    id: true,
                    action: true,
                    resource: true,
                    details: true,
                    ipAddress: true,
                    success: true,
                    createdAt: true,
                },
            })
            expect(result).toEqual(mockLogs)
        })

        it('should limit results correctly', async () => {
            ; (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue([])

            await getAdminAuditLogs('admin-123', 50)

            expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 50,
                })
            )
        })

        it('should order by createdAt desc', async () => {
            ; (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue([])

            await getAdminAuditLogs('admin-123')

            expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { createdAt: 'desc' },
                })
            )
        })
    })

    describe('getRecentAuditLogs', () => {
        it('should return all recent logs without filters', async () => {
            const mockLogs = [
                createMockAdminLog({
                    id: 'log-1',
                    adminId: 'admin-1',
                    action: 'USER_VIEW',
                    // @ts-expect-error - admin include is not in the helper type but valid for Prisma result
                    admin: { id: 'admin-1', name: 'Admin 1', email: 'admin1@example.com' },
                }),
            ]

                ; (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue(mockLogs)

            const result = await getRecentAuditLogs()

            expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith({
                where: {},
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: {
                    admin: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            })
            expect(result).toEqual(mockLogs)
        })

        it('should filter by adminId', async () => {
            ; (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue([])

            await getRecentAuditLogs(50, { adminId: 'admin-123' })

            expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { adminId: 'admin-123' },
                })
            )
        })

        it('should filter by action', async () => {
            ; (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue([])

            await getRecentAuditLogs(50, { action: 'LOGIN_SUCCESS' })

            expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { action: 'LOGIN_SUCCESS' },
                })
            )
        })

        it('should filter by success status', async () => {
            ; (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue([])

            await getRecentAuditLogs(50, { success: false })

            expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { success: false },
                })
            )
        })

        it('should filter by date range', async () => {
            const startDate = new Date('2023-01-01')
            const endDate = new Date('2023-01-31')

                ; (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue([])

            await getRecentAuditLogs(50, { startDate, endDate })

            expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                })
            )
        })

        it('should filter by startDate only', async () => {
            const startDate = new Date('2023-01-01')

                ; (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue([])

            await getRecentAuditLogs(50, { startDate })

            expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        createdAt: {
                            gte: startDate,
                        },
                    },
                })
            )
        })

        it('should handle multiple filters combined', async () => {
            const startDate = new Date('2023-01-01')

                ; (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue([])

            await getRecentAuditLogs(50, {
                adminId: 'admin-123',
                action: 'USER_DELETE',
                success: true,
                startDate,
            })

            expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        adminId: 'admin-123',
                        action: 'USER_DELETE',
                        success: true,
                        createdAt: {
                            gte: startDate,
                        },
                    },
                })
            )
        })
    })

    describe('getAuditLogActions', () => {
        it('should return unique action types', async () => {
            const mockActions = [
                { action: 'LOGIN_SUCCESS' },
                { action: 'USER_VIEW' },
                { action: 'USER_DELETE' },
            ]

                ; (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue(mockActions)

            const result = await getAuditLogActions()

            expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith({
                select: { action: true },
                distinct: ['action'],
                orderBy: { action: 'asc' },
            })
            expect(result).toEqual(['LOGIN_SUCCESS', 'USER_VIEW', 'USER_DELETE'])
        })

        it('should return empty array if no logs', async () => {
            ; (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue([])

            const result = await getAuditLogActions()

            expect(result).toEqual([])
        })
    })

    describe('AUDIT_ACTIONS constants', () => {
        it('should export all expected action constants', () => {
            expect(AUDIT_ACTIONS.LOGIN_SUCCESS).toBe('LOGIN_SUCCESS')
            expect(AUDIT_ACTIONS.LOGIN_FAILED).toBe('LOGIN_FAILED')
            expect(AUDIT_ACTIONS.LOGIN_LOCKED).toBe('LOGIN_LOCKED')
            expect(AUDIT_ACTIONS.LOGOUT).toBe('LOGOUT')
            expect(AUDIT_ACTIONS.LOGOUT_ALL).toBe('LOGOUT_ALL')
            expect(AUDIT_ACTIONS.SESSION_REVOKED).toBe('SESSION_REVOKED')
            expect(AUDIT_ACTIONS.PASSWORD_CHANGE).toBe('PASSWORD_CHANGE')
            expect(AUDIT_ACTIONS.USER_VIEW).toBe('USER_VIEW')
            expect(AUDIT_ACTIONS.USER_UPDATE).toBe('USER_UPDATE')
            expect(AUDIT_ACTIONS.USER_ACTIVATE).toBe('USER_ACTIVATE')
            expect(AUDIT_ACTIONS.USER_DEACTIVATE).toBe('USER_DEACTIVATE')
            expect(AUDIT_ACTIONS.USER_DELETE).toBe('USER_DELETE')
            expect(AUDIT_ACTIONS.LINK_VIEW).toBe('LINK_VIEW')
            expect(AUDIT_ACTIONS.LINK_DELETE).toBe('LINK_DELETE')
            expect(AUDIT_ACTIONS.ADMIN_CREATE).toBe('ADMIN_CREATE')
            expect(AUDIT_ACTIONS.ADMIN_UPDATE).toBe('ADMIN_UPDATE')
            expect(AUDIT_ACTIONS.ADMIN_DELETE).toBe('ADMIN_DELETE')
            expect(AUDIT_ACTIONS.ADMIN_ACTIVATE).toBe('ADMIN_ACTIVATE')
            expect(AUDIT_ACTIONS.ADMIN_DEACTIVATE).toBe('ADMIN_DEACTIVATE')
            expect(AUDIT_ACTIONS.CRON_MANUAL_TRIGGER).toBe('CRON_MANUAL_TRIGGER')
            expect(AUDIT_ACTIONS.SETTINGS_CHANGE).toBe('SETTINGS_CHANGE')
        })
    })
})
