export const TEST_PASSWORD = 'password123'
export const TEST_HASHED_PASSWORD = 'hashed-password'
export const TEST_TOKEN = 'valid-token'
export const TEST_SECRET = 'test-secret'
export const TEST_VERIFICATION_CODE = '123456'
export const TEST_WRONG_PASSWORD = 'wrong-password'
export const TEST_SHORT_SECRET = 'short-secret'
export const TEST_WEAK_SECRET = 'change-me-please-change-me-please-change-me'
export const TEST_STRONG_SECRET = 'a-very-long-and-secure-secret-that-is-random-enough-9876543210'
export const TEST_LOW_ENTROPY_SECRET = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
export const TEST_DEV_SECRET = 'development-secret-that-is-long-enough-but-contains-dev'
export const TEST_TOO_SHORT_PASSWORD = '123'
export const TEST_DUMMY_HASH = 'dummy_hash'
export const TEST_NEW_HASHED_PASSWORD = 'hashed-new-password'
export const TEST_TURNSTILE_TOKEN = 'turnstile-token'
export const TEST_INVALID_TOKEN = 'invalid-token'
export const TEST_VERIFICATION_CODE_ALT = '654321'

// Dummy test to satisfy Jest
if (process.env.NODE_ENV === 'test') {
    describe('test-constants', () => {
        it('should export constants', () => {
            expect(TEST_PASSWORD).toBeDefined()
        })
    })
}
