/**
 * @jest-environment node
 */
import {
    resetMonthlyLimits,
    deactivateExpiredLinks,
    deletePermanentLinks,
    manualMonthlyReset,
    manualLinkCleanup,
    initializeCronJobs
} from '../cron'
import cron from 'node-cron'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

// Mock dependencies
jest.mock('node-cron', () => ({
    schedule: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            updateMany: jest.fn(),
        },
        link: {
            updateMany: jest.fn(),
            deleteMany: jest.fn(),
            findMany: jest.fn(),
        },
    },
}))

jest.mock('@/lib/email', () => ({
    sendEmail: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}))

describe('cron', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('initializeCronJobs', () => {
        it('should schedule all jobs', () => {
            initializeCronJobs()
            expect(cron.schedule).toHaveBeenCalledTimes(3)
            expect(logger.info).toHaveBeenCalledWith('Initializing cron jobs...')
        })
    })

    describe('manualMonthlyReset', () => {
        it('should reset limits successfully', async () => {
            (prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 5 })
                ; (prisma.link.updateMany as jest.Mock).mockResolvedValue({ count: 3 })

            const result = await manualMonthlyReset()

            expect(result.success).toBe(true)
            expect(result.usersUpdated).toBe(5)
            expect(prisma.user.updateMany).toHaveBeenCalled()
            expect(prisma.link.updateMany).toHaveBeenCalled()
        })

        it('should handle errors', async () => {
            const error = new Error('DB Error')
                ; (prisma.user.updateMany as jest.Mock).mockRejectedValue(error)

            const result = await manualMonthlyReset()

            expect(result.success).toBe(false)
            expect(result.error).toBe('DB Error')
            expect(logger.error).toHaveBeenCalledWith('Manual monthly reset error:', error)
        })
    })

    describe('manualLinkCleanup', () => {
        it('should deactivate old links', async () => {
            (prisma.link.updateMany as jest.Mock).mockResolvedValue({ count: 10 })

            const result = await manualLinkCleanup()

            expect(result.success).toBe(true)
            expect(result.linksDeactivated).toBe(10)
            expect(prisma.link.updateMany).toHaveBeenCalled()
        })

        it('should handle errors', async () => {
            const error = new Error('DB Error')
                ; (prisma.link.updateMany as jest.Mock).mockRejectedValue(error)

            const result = await manualLinkCleanup()

            expect(result.success).toBe(false)
            expect(logger.error).toHaveBeenCalledWith('Manual link cleanup error:', error)
        })
    })

    describe('Scheduled Jobs Logic', () => {
        describe('resetMonthlyLimits', () => {
            it('should execute reset logic', async () => {
                (prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 5 })

                await resetMonthlyLimits()

                expect(prisma.user.updateMany).toHaveBeenCalled()
                expect(logger.info).toHaveBeenCalledWith('Monthly limit reset completed.')
            })

            it('should handle errors', async () => {
                const error = new Error('DB Error')
                    ; (prisma.user.updateMany as jest.Mock).mockRejectedValue(error)

                await resetMonthlyLimits()

                expect(logger.error).toHaveBeenCalledWith('Monthly limit reset error:', error)
            })
        })

        describe('deactivateExpiredLinks', () => {
            it('should send warnings and deactivate links', async () => {
                const mockLinks = [
                    {
                        id: 'link-1',
                        user: {
                            email: 'user@example.com',
                            nimOrUsername: 'user1'
                        },
                        shortUrl: 'abc',
                        longUrl: 'http://example.com',
                        createdAt: new Date('2023-01-01'), // Old
                        lastVisited: null,
                    }
                ]

                    // Mock finding links
                    ; (prisma.link.findMany as jest.Mock).mockResolvedValue(mockLinks)
                    ; (prisma.link.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

                await deactivateExpiredLinks()

                expect(sendEmail).toHaveBeenCalled()
                expect(prisma.link.updateMany).toHaveBeenCalled()
            })
        })

        describe('deletePermanentLinks', () => {
            it('should delete permanently inactive links', async () => {
                const mockLinks = [{ id: 'link-old' }]

                    ; (prisma.link.findMany as jest.Mock).mockResolvedValue(mockLinks)
                    ; (prisma.link.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })

                await deletePermanentLinks()

                expect(prisma.link.deleteMany).toHaveBeenCalled()
                // expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Permanently deleted'))
            })
        })
    })
})
