import { prisma } from './prisma'

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 60 * 60 * 1000 // 1 hour

export type AttemptType = 'email_verification' | 'password_reset' | '2fa_setup' | '2fa_login'

/**
 * Check if a user account is currently locked for a specific verification type
 * @returns true if account is locked, false if allowed to attempt
 */
export async function isAccountLocked(userId: string, attemptType: AttemptType): Promise<boolean> {
    const attempt = await prisma.verificationAttempt.findUnique({
        where: {
            userId_attemptType: {
                userId,
                attemptType
            }
        },
        select: {
            lockedUntil: true
        }
    })

    if (!attempt || !attempt.lockedUntil) {
        return false
    }

    // Check if lockout period has expired
    if (new Date() > attempt.lockedUntil) {
        // Lockout expired, clear it
        await prisma.verificationAttempt.update({
            where: {
                userId_attemptType: {
                    userId,
                    attemptType
                }
            },
            data: {
                lockedUntil: null,
                failedAttempts: 0,
                updatedAt: new Date()
            }
        })
        return false
    }

    return true
}

/**
 * Record a failed verification attempt
 * Locks the account after MAX_ATTEMPTS failures
 */
export async function recordFailedAttempt(userId: string, attemptType: AttemptType): Promise<void> {
    const existingAttempt = await prisma.verificationAttempt.findUnique({
        where: {
            userId_attemptType: {
                userId,
                attemptType
            }
        }
    })

    if (!existingAttempt) {
        // First failed attempt
        await prisma.verificationAttempt.create({
            data: {
                userId,
                attemptType,
                failedAttempts: 1,
                lastAttemptAt: new Date()
            }
        })
    } else {
        const newFailedAttempts = existingAttempt.failedAttempts + 1
        const shouldLock = newFailedAttempts >= MAX_ATTEMPTS

        await prisma.verificationAttempt.update({
            where: {
                userId_attemptType: {
                    userId,
                    attemptType
                }
            },
            data: {
                failedAttempts: newFailedAttempts,
                lastAttemptAt: new Date(),
                lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : existingAttempt.lockedUntil,
                updatedAt: new Date()
            }
        })
    }
}

/**
 * Clear verification attempts for a user (called on successful verification)
 */
export async function clearAttempts(userId: string, attemptType: AttemptType): Promise<void> {
    await prisma.verificationAttempt.deleteMany({
        where: {
            userId,
            attemptType
        }
    })
}

/**
 * Cleanup expired lockouts (for cron job)
 * Removes verification attempts where lockout has expired
 */
export async function cleanupExpiredLockouts(): Promise<number> {
    const result = await prisma.verificationAttempt.deleteMany({
        where: {
            lockedUntil: {
                not: null,
                lt: new Date()
            }
        }
    })

    return result.count
}
