/**
 * @jest-environment node
 */
import {
    isAccountLocked,
    recordFailedAttempt,
    recordSuccessfulAttempt,
    getRemainingLockTime,
    cleanupExpiredLockouts,
} from '../admin-verification'
import { prisma } from '../prisma'
import { pastDate, futureDate } from '@/__tests__/test-utils'

// Mock prisma
jest.mock('../prisma', () => ({
    prisma: {
        adminVerificationAttempt: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
            deleteMany: jest.fn(),
        },
    },
}))

describe('Admin Verification', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('isAccountLocked', () => {
        it('should return unlocked for new account (no attempts)', async () => {
            ; (prisma.adminVerificationAttempt.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await isAccountLocked('admin-123', 'login')

            expect(result.locked).toBe(false)
            expect(result.remainingAttempts).toBe(5) // MAX_LOGIN_ATTEMPTS
        })

        it('should return unlocked with remaining attempts', async () => {
            const mockAttempt = {
                adminId: 'admin-123',
                attemptType: 'login',
                failedAttempts: 2,
                lockedUntil: null,
            }

                ; (prisma.adminVerificationAttempt.findUnique as jest.Mock).mockResolvedValue(mockAttempt)

            const result = await isAccountLocked('admin-123', 'login')

            expect(result.locked).toBe(false)
            expect(result.remainingAttempts).toBe(3) // 5 - 2
        })

        it('should return locked with lockout end time', async () => {
            const lockoutEnd = futureDate(10)
            const mockAttempt = {
                adminId: 'admin-123',
                attemptType: 'login',
                failedAttempts: 5,
                lockedUntil: lockoutEnd,
            }

                ; (prisma.adminVerificationAttempt.findUnique as jest.Mock).mockResolvedValue(mockAttempt)

            const result = await isAccountLocked('admin-123', 'login')

            expect(result.locked).toBe(true)
            expect(result.lockoutEndsAt).toEqual(lockoutEnd)
        })

        it('should unlock if lockout expired', async () => {
            const expiredLockout = pastDate(5)
            const mockAttempt = {
                adminId: 'admin-123',
                attemptType: 'login',
                failedAttempts: 5,
                lockedUntil: expiredLockout,
            }

                ; (prisma.adminVerificationAttempt.findUnique as jest.Mock).mockResolvedValue(mockAttempt)
                ; (prisma.adminVerificationAttempt.update as jest.Mock).mockResolvedValue({})

            const result = await isAccountLocked('admin-123', 'login')

            expect(result.locked).toBe(false)
            expect(result.remainingAttempts).toBe(5)
            // Should clear the lockout
            expect(prisma.adminVerificationAttempt.update).toHaveBeenCalledWith({
                where: {
                    adminId_attemptType: {
                        adminId: 'admin-123',
                        attemptType: 'login',
                    },
                },
                data: {
                    lockedUntil: null,
                    failedAttempts: 0,
                    updatedAt: expect.any(Date),
                },
            })
        })

        it('should reset attempts after lockout expiry', async () => {
            const expiredLockout = pastDate(20)
            const mockAttempt = {
                adminId: 'admin-123',
                attemptType: '2fa',
                failedAttempts: 5,
                lockedUntil: expiredLockout,
            }

                ; (prisma.adminVerificationAttempt.findUnique as jest.Mock).mockResolvedValue(mockAttempt)
                ; (prisma.adminVerificationAttempt.update as jest.Mock).mockResolvedValue({})

            await isAccountLocked('admin-123', '2fa')

            const updateCall = (prisma.adminVerificationAttempt.update as jest.Mock).mock.calls[0][0]
            expect(updateCall.data.failedAttempts).toBe(0)
        })
    })

    describe('recordFailedAttempt', () => {
        it('should record first failed attempt', async () => {
            ; (prisma.adminVerificationAttempt.findUnique as jest.Mock).mockResolvedValue(null)
                ; (prisma.adminVerificationAttempt.create as jest.Mock).mockResolvedValue({})

            const result = await recordFailedAttempt('admin-123', 'login')

            expect(result.locked).toBe(false)
            expect(result.remainingAttempts).toBe(4) // 5 - 1
            expect(prisma.adminVerificationAttempt.create).toHaveBeenCalledWith({
                data: {
                    adminId: 'admin-123',
                    attemptType: 'login',
                    failedAttempts: 1,
                    lastAttemptAt: expect.any(Date),
                },
            })
        })

        it('should increment failed attempts', async () => {
            const mockAttempt = {
                adminId: 'admin-123',
                attemptType: 'login',
                failedAttempts: 2,
                lockedUntil: null,
            }

                ; (prisma.adminVerificationAttempt.findUnique as jest.Mock).mockResolvedValue(mockAttempt)
                ; (prisma.adminVerificationAttempt.update as jest.Mock).mockResolvedValue({})

            const result = await recordFailedAttempt('admin-123', 'login')

            expect(result.locked).toBe(false)
            expect(result.remainingAttempts).toBe(2) // 5 - 3
            expect(prisma.adminVerificationAttempt.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        failedAttempts: 3,
                    }),
                })
            )
        })

        it('should lock account after max login attempts (5)', async () => {
            const mockAttempt = {
                adminId: 'admin-123',
                attemptType: 'login',
                failedAttempts: 4,
                lockedUntil: null,
            }

                ; (prisma.adminVerificationAttempt.findUnique as jest.Mock).mockResolvedValue(mockAttempt)
                ; (prisma.adminVerificationAttempt.update as jest.Mock).mockResolvedValue({})

            const result = await recordFailedAttempt('admin-123', 'login')

            expect(result.locked).toBe(true)
            expect(result.lockoutEndsAt).toBeInstanceOf(Date)
            expect(prisma.adminVerificationAttempt.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        failedAttempts: 5,
                        lockedUntil: expect.any(Date),
                    }),
                })
            )
        })

        it('should lock account after max 2FA attempts (5)', async () => {
            const mockAttempt = {
                adminId: 'admin-123',
                attemptType: '2fa',
                failedAttempts: 4,
                lockedUntil: null,
            }

                ; (prisma.adminVerificationAttempt.findUnique as jest.Mock).mockResolvedValue(mockAttempt)
                ; (prisma.adminVerificationAttempt.update as jest.Mock).mockResolvedValue({})

            const result = await recordFailedAttempt('admin-123', '2fa')

            expect(result.locked).toBe(true)
        })

        it('should set lockout duration correctly for login (15 min)', async () => {
            const mockAttempt = {
                adminId: 'admin-123',
                attemptType: 'login',
                failedAttempts: 4,
                lockedUntil: null,
            }

            const beforeLock = new Date()
                ; (prisma.adminVerificationAttempt.findUnique as jest.Mock).mockResolvedValue(mockAttempt)
                ; (prisma.adminVerificationAttempt.update as jest.Mock).mockResolvedValue({})

            const result = await recordFailedAttempt('admin-123', 'login')

            // Lockout should be ~15 minutes from now
            const expectedLockout = new Date(beforeLock.getTime() + 15 * 60 * 1000)
            const timeDiff = Math.abs(result.lockoutEndsAt!.getTime() - expectedLockout.getTime())
            expect(timeDiff).toBeLessThan(1000) // Within 1 second
        })

        it('should set lockout duration correctly for 2fa (30 min)', async () => {
            const mockAttempt = {
                adminId: 'admin-123',
                attemptType: '2fa',
                failedAttempts: 4,
                lockedUntil: null,
            }

            const beforeLock = new Date()
                ; (prisma.adminVerificationAttempt.findUnique as jest.Mock).mockResolvedValue(mockAttempt)
                ; (prisma.adminVerificationAttempt.update as jest.Mock).mockResolvedValue({})

            const result = await recordFailedAttempt('admin-123', '2fa')

            // Lockout should be ~30 minutes from now
            const expectedLockout = new Date(beforeLock.getTime() + 30 * 60 * 1000)
            const timeDiff = Math.abs(result.lockoutEndsAt!.getTime() - expectedLockout.getTime())
            expect(timeDiff).toBeLessThan(1000) // Within 1 second
        })

        it('should return correct remaining attempts', async () => {
            const mockAttempt = {
                adminId: 'admin-123',
                attemptType: 'login',
                failedAttempts: 1,
                lockedUntil: null,
            }

                ; (prisma.adminVerificationAttempt.findUnique as jest.Mock).mockResolvedValue(mockAttempt)
                ; (prisma.adminVerificationAttempt.update as jest.Mock).mockResolvedValue({})

            const result = await recordFailedAttempt('admin-123', 'login')

            expect(result.remainingAttempts).toBe(3) // 5 - 2
        })
    })

    describe('recordSuccessfulAttempt', () => {
        it('should clear failed attempts', async () => {
            ; (prisma.adminVerificationAttempt.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })

            await recordSuccessfulAttempt('admin-123', 'login')

            expect(prisma.adminVerificationAttempt.deleteMany).toHaveBeenCalledWith({
                where: {
                    adminId: 'admin-123',
                    attemptType: 'login',
                },
            })
        })

        it('should remove verification attempt record', async () => {
            ; (prisma.adminVerificationAttempt.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })

            await recordSuccessfulAttempt('admin-123', '2fa')

            expect(prisma.adminVerificationAttempt.deleteMany).toHaveBeenCalled()
        })
    })

    describe('getRemainingLockTime', () => {
        it('should return 0 for unlocked account', async () => {
            ; (prisma.adminVerificationAttempt.findUnique as jest.Mock).mockResolvedValue(null)

            const seconds = await getRemainingLockTime('admin-123', 'login')

            expect(seconds).toBe(0)
        })

        it('should return seconds remaining for locked account', async () => {
            const lockoutEnd = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
            const mockAttempt = {
                adminId: 'admin-123',
                attemptType: 'login',
                failedAttempts: 5,
                lockedUntil: lockoutEnd,
            }

                ; (prisma.adminVerificationAttempt.findUnique as jest.Mock).mockResolvedValue(mockAttempt)

            const seconds = await getRemainingLockTime('admin-123', 'login')

            // Should be around 300 seconds (5 minutes)
            expect(seconds).toBeGreaterThan(295)
            expect(seconds).toBeLessThanOrEqual(300)
        })

        it('should return 0 for expired lockout', async () => {
            const expiredLockout = pastDate(10)
            const mockAttempt = {
                adminId: 'admin-123',
                attemptType: 'login',
                failedAttempts: 5,
                lockedUntil: expiredLockout,
            }

                ; (prisma.adminVerificationAttempt.findUnique as jest.Mock).mockResolvedValue(mockAttempt)
                ; (prisma.adminVerificationAttempt.update as jest.Mock).mockResolvedValue({})

            const seconds = await getRemainingLockTime('admin-123', 'login')

            expect(seconds).toBe(0)
        })
    })

    describe('cleanupExpiredLockouts', () => {
        it('should delete expired lockouts', async () => {
            ; (prisma.adminVerificationAttempt.deleteMany as jest.Mock).mockResolvedValue({ count: 10 })

            const count = await cleanupExpiredLockouts()

            expect(count).toBe(10)
            expect(prisma.adminVerificationAttempt.deleteMany).toHaveBeenCalledWith({
                where: {
                    lockedUntil: {
                        not: null,
                        lt: expect.any(Date),
                    },
                },
            })
        })

        it('should not delete active lockouts', async () => {
            ; (prisma.adminVerificationAttempt.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })

            await cleanupExpiredLockouts()

            const deleteCall = (prisma.adminVerificationAttempt.deleteMany as jest.Mock).mock.calls[0][0]
            expect(deleteCall.where.lockedUntil.lt).toBeInstanceOf(Date)
            expect(deleteCall.where.lockedUntil.lt.getTime()).toBeLessThanOrEqual(Date.now())
        })

        it('should return count deleted', async () => {
            ; (prisma.adminVerificationAttempt.deleteMany as jest.Mock).mockResolvedValue({ count: 7 })

            const count = await cleanupExpiredLockouts()

            expect(count).toBe(7)
        })
    })

    describe('Attempt Types', () => {
        it('should handle login attempt type', async () => {
            ; (prisma.adminVerificationAttempt.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await isAccountLocked('admin-123', 'login')

            expect(result.remainingAttempts).toBe(5)
        })

        it('should handle 2fa attempt type', async () => {
            ; (prisma.adminVerificationAttempt.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await isAccountLocked('admin-123', '2fa')

            expect(result.remainingAttempts).toBe(5)
        })

        it('should handle password_reset attempt type', async () => {
            ; (prisma.adminVerificationAttempt.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await isAccountLocked('admin-123', 'password_reset')

            expect(result.remainingAttempts).toBe(5)
        })
    })
})
