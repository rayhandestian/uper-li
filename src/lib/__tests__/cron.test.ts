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
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

// Mock dependencies
jest.mock('node-cron', () => ({
    schedule: jest.fn(),
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
            (db.query as jest.Mock).mockResolvedValue({ rowCount: 5 })

            const result = await manualMonthlyReset()

            expect(result.success).toBe(true)
            expect(result.usersUpdated).toBe(5)
            expect(db.query).toHaveBeenCalled()
        })

        it('should handle errors', async () => {
            const error = new Error('DB Error')
                ; (db.query as jest.Mock).mockRejectedValue(error)

            const result = await manualMonthlyReset()

            expect(result.success).toBe(false)
            expect(result.error).toBe('DB Error')
            expect(logger.error).toHaveBeenCalledWith('Manual monthly reset error:', error)
        })
    })

    describe('manualLinkCleanup', () => {
        it('should deactivate old links', async () => {
            (db.query as jest.Mock).mockResolvedValue({ rowCount: 10 })

            const result = await manualLinkCleanup()

            expect(result.success).toBe(true)
            expect(result.linksDeactivated).toBe(10)
            expect(db.query).toHaveBeenCalled()
        })

        it('should handle errors', async () => {
            const error = new Error('DB Error')
                ; (db.query as jest.Mock).mockRejectedValue(error)

            const result = await manualLinkCleanup()

            expect(result.success).toBe(false)
            expect(logger.error).toHaveBeenCalledWith('Manual link cleanup error:', error)
        })
    })

    describe('Scheduled Jobs Logic', () => {
        describe('resetMonthlyLimits', () => {
            it('should execute reset logic', async () => {
                (db.query as jest.Mock).mockResolvedValue({})

                await resetMonthlyLimits()

                expect(db.query).toHaveBeenCalled()
                expect(logger.info).toHaveBeenCalledWith('Monthly limit reset completed.')
            })

            it('should handle errors', async () => {
                const error = new Error('DB Error')
                    ; (db.query as jest.Mock).mockRejectedValue(error)

                await resetMonthlyLimits()

                expect(logger.error).toHaveBeenCalledWith('Monthly limit reset error:', error)
            })
        })

        describe('deactivateExpiredLinks', () => {
            it('should send warnings and deactivate links', async () => {
                const mockLinks = [
                    {
                        id: 'link-1',
                        email: 'user@example.com',
                        shortUrl: 'abc',
                        longUrl: 'http://example.com',
                        createdAt: new Date('2023-01-01'), // Old
                        lastVisited: null,
                        nimOrUsername: 'user1'
                    }
                ]

                    // Mock finding links
                    ; (db.query as jest.Mock)
                        .mockResolvedValueOnce({ rows: mockLinks }) // Select links
                        .mockResolvedValueOnce({ rowCount: 1 }) // Update links
                        .mockResolvedValueOnce({}) // Log

                await deactivateExpiredLinks()

                expect(sendEmail).toHaveBeenCalled()
                expect(db.query).toHaveBeenCalled()
            })
        })

        describe('deletePermanentLinks', () => {
            it('should delete permanently inactive links', async () => {
                const mockLinks = [{ id: 'link-old' }]

                    ; (db.query as jest.Mock)
                        .mockResolvedValueOnce({ rows: mockLinks }) // Select
                        .mockResolvedValueOnce({ rowCount: 1 }) // Delete
                        .mockResolvedValueOnce({}) // Log

                await deletePermanentLinks()

                expect(db.query).toHaveBeenCalled()
                expect(db.query).toHaveBeenCalled()
                // expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Permanently deleted'))
            })
        })
    })
})
