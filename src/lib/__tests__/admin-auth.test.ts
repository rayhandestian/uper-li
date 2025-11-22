import { signAdminToken, verifyAdminToken } from '../admin-auth'

describe('Admin Auth', () => {
    const originalEnv = process.env

    beforeEach(() => {
        jest.resetModules()
        process.env = { ...originalEnv, ADMIN_PASSCODE: 'secret-passcode' }
    })

    afterAll(() => {
        process.env = originalEnv
    })

    it('should sign and verify a valid token', () => {
        const token = signAdminToken()
        expect(typeof token).toBe('string')
        expect(verifyAdminToken(token)).toBe(true)
    })

    it('should return false for invalid token', () => {
        expect(verifyAdminToken('invalid.token')).toBe(false)
    })

    it('should return false for tampered token', () => {
        const token = signAdminToken()
        const [payload, signature] = token.split('.')
        const tamperedToken = `${payload}a.${signature}`
        expect(verifyAdminToken(tamperedToken)).toBe(false)
    })

    it('should throw error if ADMIN_PASSCODE is not set', () => {
        delete process.env.ADMIN_PASSCODE
        expect(() => signAdminToken()).toThrow('ADMIN_PASSCODE environment variable must be set')
    })
})
