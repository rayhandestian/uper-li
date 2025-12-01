import { prisma } from './prisma'

// Configuration constants
const MAX_LOGIN_ATTEMPTS = 5
const MAX_2FA_ATTEMPTS = 5
const LOGIN_LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes
const TFA_LOCKOUT_DURATION_MS = 30 * 60 * 1000 // 30 minutes

export type AdminAttemptType = 'login' | '2fa' | 'password_reset'

interface VerificationStatus {
    locked: boolean
    remainingAttempts?: number
    lockoutEndsAt?: Date
}

/**
 * Get lockout duration based on attempt type
 */
function getLockoutDuration(attemptType: AdminAttemptType): number {
    switch (attemptType) {
        case 'login':
            return LOGIN_LOCKOUT_DURATION_MS
        case '2fa':
            return TFA_LOCKOUT_DURATION_MS
        case 'password_reset':
            return LOGIN_LOCKOUT_DURATION_MS
        default:
            return LOGIN_LOCKOUT_DURATION_MS
    }
}

/**
 * Get max attempts based on attempt type
 */
function getMaxAttempts(attemptType: AdminAttemptType): number {
    switch (attemptType) {
        case 'login':
            return MAX_LOGIN_ATTEMPTS
        case '2fa':
            return MAX_2FA_ATTEMPTS
        case 'password_reset':
            return MAX_LOGIN_ATTEMPTS
        default:
            return MAX_LOGIN_ATTEMPTS
    }
}

/**
 * Check if an admin account is currently locked for a specific verification type
 * @returns object with lock status and remaining attempts
 */
export async function isAccountLocked(adminId: string, attemptType: AdminAttemptType): Promise<VerificationStatus> {
    const attempt = await prisma.adminVerificationAttempt.findUnique({
        where: {
            adminId_attemptType: {
                adminId,
                attemptType
            }
        }
    })

    if (!attempt?.lockedUntil) {
        const maxAttempts = getMaxAttempts(attemptType)
        return {
            locked: false,
            remainingAttempts: attempt ? maxAttempts - attempt.failedAttempts : maxAttempts
        }
    }

    const now = new Date()

    // Check if lockout period has expired
    if (now > attempt.lockedUntil) {
        // Lockout expired, clear it
        await prisma.adminVerificationAttempt.update({
            where: {
                adminId_attemptType: {
                    adminId,
                    attemptType
                }
            },
            data: {
                lockedUntil: null,
                failedAttempts: 0,
                updatedAt: now
            }
        })
        return {
            locked: false,
            remainingAttempts: getMaxAttempts(attemptType)
        }
    }

    return {
        locked: true,
        lockoutEndsAt: attempt.lockedUntil
    }
}

/**
 * Record a failed verification attempt
 * Locks the account after MAX_ATTEMPTS failures
 * @returns Updated verification status
 */
export async function recordFailedAttempt(
    adminId: string,
    attemptType: AdminAttemptType
): Promise<VerificationStatus> {
    const existingAttempt = await prisma.adminVerificationAttempt.findUnique({
        where: {
            adminId_attemptType: {
                adminId,
                attemptType
            }
        }
    })

    const maxAttempts = getMaxAttempts(attemptType)
    const now = new Date()

    if (!existingAttempt) {
        // First failed attempt
        await prisma.adminVerificationAttempt.create({
            data: {
                adminId,
                attemptType,
                failedAttempts: 1,
                lastAttemptAt: now
            }
        })
        return {
            locked: false,
            remainingAttempts: maxAttempts - 1
        }
    }

    const newFailedAttempts = existingAttempt.failedAttempts + 1
    const shouldLock = newFailedAttempts >= maxAttempts

    if (shouldLock) {
        const lockoutDuration = getLockoutDuration(attemptType)
        const lockoutEndsAt = new Date(now.getTime() + lockoutDuration)

        await prisma.adminVerificationAttempt.update({
            where: {
                adminId_attemptType: {
                    adminId,
                    attemptType
                }
            },
            data: {
                failedAttempts: newFailedAttempts,
                lastAttemptAt: now,
                lockedUntil: lockoutEndsAt,
                updatedAt: now
            }
        })

        return {
            locked: true,
            lockoutEndsAt
        }
    }

    await prisma.adminVerificationAttempt.update({
        where: {
            adminId_attemptType: {
                adminId,
                attemptType
            }
        },
        data: {
            failedAttempts: newFailedAttempts,
            lastAttemptAt: now,
            updatedAt: now
        }
    })

    return {
        locked: false,
        remainingAttempts: maxAttempts - newFailedAttempts
    }
}

/**
 * Clear verification attempts for an admin (called on successful verification)
 */
export async function recordSuccessfulAttempt(
    adminId: string,
    attemptType: AdminAttemptType
): Promise<void> {
    await prisma.adminVerificationAttempt.deleteMany({
        where: {
            adminId,
            attemptType
        }
    })
}

/**
 * Get remaining lock time in seconds
 * @returns seconds remaining, or 0 if not locked
 */
export async function getRemainingLockTime(
    adminId: string,
    attemptType: AdminAttemptType
): Promise<number> {
    const status = await isAccountLocked(adminId, attemptType)

    if (!status.locked || !status.lockoutEndsAt) {
        return 0
    }

    const now = new Date()
    const remainingMs = status.lockoutEndsAt.getTime() - now.getTime()
    return Math.max(0, Math.ceil(remainingMs / 1000))
}

/**
 * Cleanup expired lockouts (for cron job)
 * Removes verification attempts where lockout has expired
 */
export async function cleanupExpiredLockouts(): Promise<number> {
    const result = await prisma.adminVerificationAttempt.deleteMany({
        where: {
            lockedUntil: {
                not: null,
                lt: new Date()
            }
        }
    })

    return result.count
}
