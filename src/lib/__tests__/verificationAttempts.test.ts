import { isAccountLocked, recordFailedAttempt, clearAttempts, cleanupExpiredLockouts } from '../verificationAttempts'
import { prisma } from '../prisma'

// Mock Prisma
jest.mock('../prisma', () => ({
    prisma: {
        verificationAttempt: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
        },
    },
}))

describe('verificationAttempts', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('isAccountLocked', () => {
        it('should return false when no attempt record exists', async () => {
            ; (prisma.verificationAttempt.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await isAccountLocked('user-123', 'email_verification')

            expect(result).toBe(false)
        })

        it('should return false when lockedUntil is null', async () => {
            ; (prisma.verificationAttempt.findUnique as jest.Mock).mockResolvedValue({
                lockedUntil: null
            })

            const result = await isAccountLocked('user-123', 'email_verification')

            expect(result).toBe(false)
        })

        it('should return true when account is locked', async () => {
            const futureDate = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
                ; (prisma.verificationAttempt.findUnique as jest.Mock).mockResolvedValue({
                    lockedUntil: futureDate
                })

            const result = await isAccountLocked('user-123', 'email_verification')

            expect(result).toBe(true)
        })

        it('should clear lockout and return false when lockout has expired', async () => {
            const pastDate = new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
                ; (prisma.verificationAttempt.findUnique as jest.Mock).mockResolvedValue({
                    lockedUntil: pastDate
                })

            const result = await isAccountLocked('user-123', 'email_verification')

            expect(result).toBe(false)
            expect(prisma.verificationAttempt.update).toHaveBeenCalledWith({
                where: {
                    userId_attemptType: {
                        userId: 'user-123',
                        attemptType: 'email_verification'
                    }
                },
                data: expect.objectContaining({
                    lockedUntil: null,
                    failedAttempts: 0
                })
            })
        })
    })

    describe('recordFailedAttempt', () => {
        it('should create new record on first failed attempt', async () => {
            ; (prisma.verificationAttempt.findUnique as jest.Mock).mockResolvedValue(null)

            await recordFailedAttempt('user-123', 'email_verification')

            expect(prisma.verificationAttempt.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 'user-123',
                    attemptType: 'email_verification',
                    failedAttempts: 1
                })
            })
        })

        it('should increment failed attempts on subsequent failures', async () => {
            ; (prisma.verificationAttempt.findUnique as jest.Mock).mockResolvedValue({
                failedAttempts: 2,
                lockedUntil: null
            })

            await recordFailedAttempt('user-123', 'email_verification')

            expect(prisma.verificationAttempt.update).toHaveBeenCalledWith({
                where: {
                    userId_attemptType: {
                        userId: 'user-123',
                        attemptType: 'email_verification'
                    }
                },
                data: expect.objectContaining({
                    failedAttempts: 3,
                    lockedUntil: null
                })
            })
        })

        it('should lock account after 5 failed attempts', async () => {
            ; (prisma.verificationAttempt.findUnique as jest.Mock).mockResolvedValue({
                failedAttempts: 4,
                lockedUntil: null
            })

            await recordFailedAttempt('user-123', 'email_verification')

            const updateCall = (prisma.verificationAttempt.update as jest.Mock).mock.calls[0]
            expect(updateCall[0].data.failedAttempts).toBe(5)
            expect(updateCall[0].data.lockedUntil).toBeInstanceOf(Date)
            expect(updateCall[0].data.lockedUntil.getTime()).toBeGreaterThan(Date.now())
        })
    })

    describe('clearAttempts', () => {
        it('should delete verification attempts for user and type', async () => {
            await clearAttempts('user-123', 'email_verification')

            expect(prisma.verificationAttempt.deleteMany).toHaveBeenCalledWith({
                where: {
                    userId: 'user-123',
                    attemptType: 'email_verification'
                }
            })
        })
    })

    describe('cleanupExpiredLockouts', () => {
        it('should delete expired lockouts', async () => {
            ; (prisma.verificationAttempt.deleteMany as jest.Mock).mockResolvedValue({ count: 5 })

            const result = await cleanupExpiredLockouts()

            expect(result).toBe(5)
            expect(prisma.verificationAttempt.deleteMany).toHaveBeenCalledWith({
                where: {
                    lockedUntil: {
                        not: null,
                        lt: expect.any(Date)
                    }
                }
            })
        })
    })
})
