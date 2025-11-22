import {
    manualMonthlyReset,
    manualLinkCleanup,
} from '../cron'
import { db } from '../db'

// Mock dependencies
jest.mock('../db', () => ({
    db: {
        query: jest.fn(),
    },
}))

jest.mock('../email', () => ({
    sendEmail: jest.fn(),
}))

describe('Cron Manual Functions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('manualMonthlyReset', () => {
        it('should reset monthly limits successfully', async () => {
            (db.query as jest.Mock)
                .mockResolvedValueOnce({ rowCount: 10 }) // User update
                .mockResolvedValueOnce({ rowCount: 50 }) // Link update

            const result = await manualMonthlyReset()

            expect(result.success).toBe(true)
            expect(result.usersUpdated).toBe(10)
            expect(result.linksUpdated).toBe(50)
            expect(db.query).toHaveBeenCalledTimes(2)
        })

        it('should handle errors gracefully', async () => {
            const error = new Error('DB Error')
                ; (db.query as jest.Mock).mockRejectedValue(error)

            const result = await manualMonthlyReset()

            expect(result.success).toBe(false)
            expect(result.error).toBe('DB Error')
        })
    })

    describe('manualLinkCleanup', () => {
        it('should deactivate old links successfully', async () => {
            (db.query as jest.Mock).mockResolvedValue({ rowCount: 25 })

            const result = await manualLinkCleanup()

            expect(result.success).toBe(true)
            expect(result.linksDeactivated).toBe(25)
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE "Link"'),
                expect.any(Array)
            )
        })

        it('should handle errors gracefully', async () => {
            const error = new Error('Cleanup Error')
                ; (db.query as jest.Mock).mockRejectedValue(error)

            const result = await manualLinkCleanup()

            expect(result.success).toBe(false)
            expect(result.error).toBe('Cleanup Error')
        })
    })
})
