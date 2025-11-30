/**
 * @jest-environment node
 */
import { AuthService } from '../authService'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendEmail } from '@/lib/email'
import { generateSecureCode } from '@/lib/generateSecureCode'
import { addConstantDelay, performDummyHash } from '@/lib/timing'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}))
jest.mock('bcryptjs')
jest.mock('@/lib/email')
jest.mock('@/lib/generateSecureCode')
jest.mock('@/lib/timing')
jest.mock('@/lib/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}))

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('validateUser', () => {
        it('should return null if credentials are missing', async () => {
            const result = await AuthService.validateUser({})

            expect(result).toBeNull()
            expect(performDummyHash).toHaveBeenCalled()
            expect(addConstantDelay).toHaveBeenCalled()
        })

        it('should return null if user not found', async () => {
            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
                ; (bcrypt.hash as jest.Mock).mockResolvedValue('dummy-hash')
                ; (bcrypt.compare as jest.Mock).mockResolvedValue(false)

            const result = await AuthService.validateUser({
                nimOrUsername: 'test',
                password: 'password',
            })

            expect(result).toBeNull()
            expect(addConstantDelay).toHaveBeenCalled()
        })

        it('should return null if password invalid', async () => {
            const mockUser = {
                id: 'user-123',
                password: 'hashed-password',
                emailVerified: new Date(),
            }
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
                ; (bcrypt.compare as jest.Mock).mockResolvedValue(false)

            const result = await AuthService.validateUser({
                nimOrUsername: 'test',
                password: 'wrong-password',
            })

            expect(result).toBeNull()
            expect(addConstantDelay).toHaveBeenCalled()
        })

        it('should return user if valid credentials and no 2FA', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                role: 'USER',
                nimOrUsername: 'test',
                password: 'hashed-password',
                emailVerified: new Date(),
                twoFactorEnabled: false,
            }
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
                ; (bcrypt.compare as jest.Mock).mockResolvedValue(true)

            const result = await AuthService.validateUser({
                nimOrUsername: 'test',
                password: 'password',
            })

            expect(result).toEqual({
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                role: 'USER',
                nimOrUsername: 'test',
                requires2FA: false,
            })
        })

        it('should return user with 2FA required if enabled', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                role: 'USER',
                nimOrUsername: 'test',
                password: 'hashed-password',
                emailVerified: new Date(),
                twoFactorEnabled: true,
            }
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
                ; (bcrypt.compare as jest.Mock).mockResolvedValue(true)
                ; (generateSecureCode as jest.Mock).mockReturnValue('123456')
                ; (prisma.user.update as jest.Mock).mockResolvedValue(mockUser)
                ; (sendEmail as jest.Mock).mockResolvedValue(true)

            const result = await AuthService.validateUser({
                nimOrUsername: 'test',
                password: 'password',
            })

            expect(result).toEqual({
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                role: 'USER',
                nimOrUsername: 'test',
                requires2FA: true,
            })
            expect(prisma.user.update).toHaveBeenCalled()
            expect(sendEmail).toHaveBeenCalled()
        })
    })
})
