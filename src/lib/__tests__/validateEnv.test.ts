/**
 * @jest-environment node
 */
import { validateEnvironment } from '../validateEnv'
import { logger } from '../logger'

// Mock logger
jest.mock('../logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}))

describe('validateEnvironment', () => {
    const originalEnv = process.env

    beforeEach(() => {
        jest.clearAllMocks()
        process.env = { ...originalEnv }
    })

    afterAll(() => {
        process.env = originalEnv
    })

    it('should throw error if NEXTAUTH_SECRET is missing', () => {
        delete process.env.NEXTAUTH_SECRET

        expect(() => validateEnvironment()).toThrow('Critical environment validation failed')
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('NEXTAUTH_SECRET is not defined'))
    })

    it('should throw error if NEXTAUTH_SECRET is too short', () => {
        process.env.NEXTAUTH_SECRET = 'short-secret'

        expect(() => validateEnvironment()).toThrow('Critical environment validation failed')
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('too short'))
    })

    it('should throw error if NEXTAUTH_SECRET is weak', () => {
        process.env.NEXTAUTH_SECRET = 'change-me-please-change-me-please-change-me'

        expect(() => validateEnvironment()).toThrow('Critical environment validation failed')
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('placeholder or weak value'))
    })

    it('should pass with valid secret', () => {
        process.env.NEXTAUTH_SECRET = 'a-very-long-and-secure-secret-that-is-random-enough-9876543210'

        expect(() => validateEnvironment()).not.toThrow()
        expect(logger.info).toHaveBeenCalledWith('Environment validation passed ✓')
    })

    it('should warn if secret has low entropy', () => {
        // 32 chars but low entropy
        process.env.NEXTAUTH_SECRET = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

        expect(() => validateEnvironment()).not.toThrow()
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('low character diversity'))
    })

    it('should warn if production secret looks like dev value', () => {
        const originalNodeEnv = process.env.NODE_ENV
        Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })
        process.env.NEXTAUTH_SECRET = 'development-secret-that-is-long-enough-but-contains-dev'

        try {
            expect(() => validateEnvironment()).not.toThrow()
            expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('may be a development value'))
        } finally {
            Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv, writable: true })
        }
    })
})
