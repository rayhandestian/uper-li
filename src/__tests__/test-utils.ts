import { NextRequest } from 'next/server'
import { TEST_HASHED_PASSWORD } from './test-constants'

/**
 * Test Utilities for Jest Tests
 * 
 * These utilities help reduce boilerplate in tests by providing
 * factories for common test data patterns.
 */

// Types for mock data
export interface MockUser {
    id: string
    email: string
    role: string
    nimOrUsername: string
    emailVerified: Date | null
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
    twoFactorLoginCode?: string | null
    twoFactorSetupCode?: string | null
    verificationTokenExpires?: Date | null
    password?: string
}

export interface MockLink {
    id: string
    shortUrl: string
    longUrl: string
    userId: string
    active?: boolean
    visitCount?: number
    password?: string | null
    custom?: boolean
    customChanges?: number
}

export interface MockSession {
    user: {
        id: string
        email: string
        role: string
        nimOrUsername: string
        requires2FA?: boolean
    }
}

/**
 * Create a mock user session
 */
export const createMockSession = (overrides?: Partial<MockSession>): MockSession => ({
    user: {
        id: 'test-user-123',
        email: 'test@example.com',
        role: 'USER',
        nimOrUsername: 'testuser',
        requires2FA: false,
        ...overrides?.user,
    },
})

/**
 * Create a mock admin session
 */
export const createMockAdminSession = (): MockSession =>
    createMockSession({
        user: {
            id: 'admin-123',
            email: 'admin@example.com',
            role: 'ADMIN',
            nimOrUsername: 'admin',
        },
    })

/**
 * Create a mock Next.js request
 */
export const createMockRequest = (
    url: string,
    options?: {
        method?: string
        body?: unknown
        headers?: Record<string, string>
    }
): NextRequest => {
    return new NextRequest(url, {
        method: options?.method || 'GET',
        body: options?.body ? JSON.stringify(options.body) : undefined,
        headers: options?.headers,
    })
}

/**
 * Mock successful database query result
 */
export const mockDbSuccess = <T = unknown>(data: T[]) => ({
    rows: data,
    rowCount: data.length,
})

/**
 * Mock empty database query result
 */
export const mockDbEmpty = () => mockDbSuccess([])

/**
 * Create a mock user object
 */
export const createMockUser = (overrides?: Partial<MockUser>): MockUser => ({
    id: 'user-123',
    email: 'test@example.com',
    role: 'USER',
    nimOrUsername: 'testuser',
    emailVerified: new Date(),
    twoFactorEnabled: false,
    password: TEST_HASHED_PASSWORD,
    ...overrides,
})

/**
 * Create a mock link object
 */
export const createMockLink = (overrides?: Partial<MockLink>): MockLink => ({
    id: 'link-123',
    shortUrl: 'abc123',
    longUrl: 'http://example.com',
    userId: 'user-123',
    active: true,
    visitCount: 0,
    password: null,
    custom: false,
    customChanges: 0,
    ...overrides,
})

/**
 * Create mock params for Next.js dynamic routes
 */
export const createMockParams = <T extends Record<string, string>>(params: T): Promise<T> => {
    return Promise.resolve(params)
}

/**
 * Mock Turnstile success response
 */
export const mockTurnstileSuccess = () => ({
    json: async () => ({ success: true }),
})

/**
 * Mock Turnstile failure response
 */
export const mockTurnstileFail = () => ({
    json: async () => ({ success: false }),
})

/**
 * Create a future date (for token expiration tests)
 */
export const futureDate = (minutes: number = 10): Date => {
    return new Date(Date.now() + minutes * 60 * 1000)
}

/**
 * Create a past date (for expired token tests)
 */
export const pastDate = (minutes: number = 10): Date => {
    return new Date(Date.now() - minutes * 60 * 1000)
}
