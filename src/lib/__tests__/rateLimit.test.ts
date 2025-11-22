import { checkRateLimit } from '../rateLimit'

jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn(),
        next: jest.fn(),
    },
    NextRequest: jest.fn(),
}))

describe('checkRateLimit', () => {
    beforeEach(() => {
        // Clear the map before each test (implementation detail: map is module-level)
        // Since we can't easily clear the module-level map without exposing a method,
        // we'll use unique identifiers for each test.
    })

    it('should allow request if within limit', () => {
        const result = checkRateLimit('test-id-1', 5, 1000)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(4)
    })

    it('should block request if limit exceeded', () => {
        const id = 'test-id-2'
        const limit = 2

        checkRateLimit(id, limit, 1000) // 1
        checkRateLimit(id, limit, 1000) // 2
        const result = checkRateLimit(id, limit, 1000) // 3 (blocked)

        expect(result.allowed).toBe(false)
        expect(result.remaining).toBe(0)
    })

    it('should reset limit after window expires', async () => {
        const id = 'test-id-3'
        const limit = 1
        const windowMs = 100

        checkRateLimit(id, limit, windowMs)
        const blocked = checkRateLimit(id, limit, windowMs)
        expect(blocked.allowed).toBe(false)

        // Wait for window to expire
        await new Promise(resolve => setTimeout(resolve, 150))

        const allowed = checkRateLimit(id, limit, windowMs)
        expect(allowed.allowed).toBe(true)
    })
})
