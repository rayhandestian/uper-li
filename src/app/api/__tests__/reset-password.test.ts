/**
 * @jest-environment node
 */
import { POST } from '../reset-password/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findFirst: jest.fn(),
            update: jest.fn(),
        },
    },
}))

jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}))

// Mock rate limit wrapper
jest.mock('@/lib/rateLimit', () => ({
    withRateLimit: <T extends (...args: unknown[]) => unknown>(handler: T) => handler,
}))

jest.mock('@/lib/verificationAttempts', () => ({
    isAccountLocked: jest.fn().mockResolvedValue(false),
    recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
    clearAttempts: jest.fn().mockResolvedValue(undefined),
}))

describe('Reset Password API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should reset password successfully', async () => {
        const validUser = {
            id: 'user-1',
            verificationTokenExpires: new Date(Date.now() + 10000), // Future
            emailVerified: new Date() // Verified user
        }

            ; (prisma.user.findFirst as jest.Mock).mockResolvedValue(validUser)
            ; (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })
            ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password')

        const req = new NextRequest('http://localhost/api/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                nimOrUsername: 'testuser',
                code: '123456',
                newPassword: 'newpassword123',
                confirmPassword: 'newpassword123'
            })
        })

        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            data: expect.objectContaining({
                password: 'hashed-new-password'
            })
        })
    })

    it('should validate missing fields', async () => {
        const req = new NextRequest('http://localhost/api/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                nimOrUsername: 'testuser',
                // Missing code
                newPassword: 'newpassword123',
                confirmPassword: 'newpassword123'
            })
        })

        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it('should validate password mismatch', async () => {
        const req = new NextRequest('http://localhost/api/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                nimOrUsername: 'testuser',
                code: '123456',
                newPassword: 'password123',
                confirmPassword: 'mismatch123'
            })
        })

        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it('should handle invalid code or user not found', async () => {
        (prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

        const req = new NextRequest('http://localhost/api/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                nimOrUsername: 'testuser',
                code: 'invalid',
                newPassword: 'newpassword123',
                confirmPassword: 'newpassword123'
            })
        })

        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it('should handle expired code', async () => {
        const expiredUser = {
            id: 'user-1',
            verificationTokenExpires: new Date(Date.now() - 10000), // Past
            emailVerified: new Date() // Verified user
        }

            ; (prisma.user.findFirst as jest.Mock).mockResolvedValue(expiredUser)

        const req = new NextRequest('http://localhost/api/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                nimOrUsername: 'testuser',
                code: '123456',
                newPassword: 'newpassword123',
                confirmPassword: 'newpassword123'
            })
        })

        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual(expect.objectContaining({ error: expect.stringContaining('kadaluarsa') }))
    })

    it('should reject password reset for unverified user', async () => {
        const unverifiedUser = {
            id: 'user-1',
            verificationTokenExpires: new Date(Date.now() + 10000), // Future
            emailVerified: null // Unverified user
        }

            ; (prisma.user.findFirst as jest.Mock).mockResolvedValue(unverifiedUser)

        const req = new NextRequest('http://localhost/api/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                nimOrUsername: 'testuser',
                code: '123456',
                newPassword: 'newpassword123',
                confirmPassword: 'newpassword123'
            })
        })

        const res = await POST(req)

        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({
            error: 'Akun belum diverifikasi. Silakan verifikasi email terlebih dahulu.'
        })

        // Ensure password update was not called
        expect(prisma.user.update).not.toHaveBeenCalled()
    })
})
