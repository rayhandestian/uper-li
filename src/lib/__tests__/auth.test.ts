import { authOptions } from '../auth'
import { prisma } from '../prisma'

// Mock dependencies
jest.mock('../prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
        },
    },
}))

jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    }),
}))

jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
}))

describe('authOptions callbacks', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('jwt callback', () => {
        it('should add user properties to token', async () => {
            const token = {}
            const user = {
                role: 'USER',
                requires2FA: false,
                nimOrUsername: 'testuser',
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await authOptions.callbacks!.jwt!({ token, user } as any)

            expect(result.role).toBe('USER')
            expect(result.requires2FA).toBe(false)
            expect(result.nimOrUsername).toBe('testuser')
        })

        it('should return token unchanged if no user', async () => {
            const token = { existing: 'data' }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await authOptions.callbacks!.jwt!({ token } as any)

            expect(result).toEqual({ existing: 'data' })
        })
    })

    describe('session callback', () => {
        it('should add token properties to session', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ twoFactorLoginCode: null })

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const session = { user: {} } as any
            const token = {
                sub: 'user-123',
                role: 'USER',
                nimOrUsername: 'testuser',
                requires2FA: true,
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await authOptions.callbacks!.session!({ session, token } as any)

            expect(result.user.id).toBe('user-123')
            expect(result.user.role).toBe('USER')
            expect(result.user.nimOrUsername).toBe('testuser')
            expect(result.user.requires2FA).toBe(false) // Should be false because twoFactorSecret is null
        })

        it('should handle session without 2FA requirement', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const session = { user: {} } as any
            const token = {
                sub: 'user-123',
                role: 'USER',
                nimOrUsername: 'testuser',
                requires2FA: false,
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await authOptions.callbacks!.session!({ session, token } as any)

            expect(result.user.requires2FA).toBe(false)
        })
    })
})
