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
    monthlyLinksCreated?: number
    totalLinks?: number
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
 * Mock generic fetch response
 */
export const mockFetchResponse = (ok: boolean, body: unknown) => ({
    ok,
    json: async () => body,
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

// ============================================================================
// Mock Setup Helpers
// ============================================================================

/**
 * Setup mock cookies for admin authentication
 */
export const setupMockCookies = (sessionValue: string | null = 'valid-session') => {
    return {
        get: jest.fn().mockReturnValue(sessionValue ? { value: sessionValue } : null),
    }
}

/**
 * Setup complete admin authentication mock
 */
export const setupMockAdminAuth = (cookiesMock: jest.Mock, validateAdminSessionMock: jest.Mock, adminData?: Partial<{ id: string; email: string; name: string; role: string; active: boolean }>) => {
    const mockAdmin = {
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        active: true,
        ...adminData,
    }

    cookiesMock.mockResolvedValue(setupMockCookies('valid-session'))
    validateAdminSessionMock.mockResolvedValue(mockAdmin)

    return mockAdmin
}

/**
 * Setup unauthenticated admin session
 */
export const setupMockUnauthenticated = (cookiesMock: jest.Mock, validateAdminSessionMock: jest.Mock) => {
    cookiesMock.mockResolvedValue(setupMockCookies(null))
    validateAdminSessionMock.mockResolvedValue(null)
}

/**
 * Setup window mocks for browser tests (confirm, alert)
 */
export interface WindowMocks {
    mockConfirm: jest.Mock
    mockAlert: jest.Mock
    cleanup: () => void
}

export const setupWindowMocks = (): WindowMocks => {
    const mockConfirm = jest.fn().mockReturnValue(true)
    const mockAlert = jest.fn()

    window.confirm = mockConfirm
    window.alert = mockAlert

    return {
        mockConfirm,
        mockAlert,
        cleanup: () => {
            jest.restoreAllMocks()
        }
    }
}

/**
 * Setup Prisma transaction mock with custom handlers
 */
export const createMockPrismaTransaction = (handlers: {
    user?: Partial<{
        findUnique: jest.Mock
        findMany: jest.Mock
        update: jest.Mock
        create: jest.Mock
    }>
    link?: Partial<{
        findUnique: jest.Mock
        findMany: jest.Mock
        update: jest.Mock
        create: jest.Mock
        count: jest.Mock
    }>
}) => {
    return async (callback: (tx: unknown) => Promise<unknown>) => {
        const tx = {
            user: {
                findUnique: handlers.user?.findUnique || jest.fn(),
                findMany: handlers.user?.findMany || jest.fn(),
                update: handlers.user?.update || jest.fn(),
                create: handlers.user?.create || jest.fn(),
            },
            link: {
                findUnique: handlers.link?.findUnique || jest.fn(),
                findMany: handlers.link?.findMany || jest.fn(),
                update: handlers.link?.update || jest.fn(),
                create: handlers.link?.create || jest.fn(),
                count: handlers.link?.count || jest.fn(),
            },
        }
        return await callback(tx)
    }
}

// ============================================================================
// Request Creation Helpers
// ============================================================================

/**
 * Create a request for uper.li domain
 */
export const createUperLiRequest = (path: string, options?: { method?: string; body?: unknown; headers?: Record<string, string> }): NextRequest => {
    return createMockRequest(`https://uper.li${path}`, options)
}

/**
 * Create a request for app.uper.li domain
 */
export const createAppUperLiRequest = (path: string, options?: { method?: string; body?: unknown; headers?: Record<string, string> }): NextRequest => {
    return createMockRequest(`https://app.uper.li${path}`, options)
}

/**
 * Create a request for admin.uper.li domain
 */
export const createAdminUperLiRequest = (path: string, options?: { method?: string; body?: unknown; headers?: Record<string, string> }): NextRequest => {
    return createMockRequest(`https://admin.uper.li${path}`, options)
}

/**
 * Create a localhost request
 */
export const createLocalhostRequest = (path: string, options?: { method?: string; body?: unknown; headers?: Record<string, string> }): NextRequest => {
    return createMockRequest(`http://localhost:3000${path}`, options)
}

/**
 * Create a request with authentication headers
 */
export const createAuthenticatedRequest = (
    url: string,
    options?: {
        method?: string
        body?: unknown
        headers?: Record<string, string>
        ipAddress?: string
    }
): NextRequest => {
    const headers: Record<string, string> = {
        ...options?.headers,
    }

    if (options?.ipAddress) {
        headers['x-forwarded-for'] = options.ipAddress
    }

    return createMockRequest(url, {
        method: options?.method,
        body: options?.body,
        headers,
    })
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that a Prisma findMany was called with specific where clause
 */
export const expectPrismaFindMany = (
    prismaMock: jest.Mock,
    whereClause: Record<string, unknown>
) => {
    expect(prismaMock).toHaveBeenCalledWith(
        expect.objectContaining({
            where: expect.objectContaining(whereClause),
        })
    )
}

/**
 * Assert that a response is a redirect
 */
export const expectRedirect = (
    response: Response,
    location: string | RegExp,
    status: number = 307
) => {
    expect(response.status).toBe(status)
    const actualLocation = response.headers.get('location')

    if (typeof location === 'string') {
        expect(actualLocation).toBe(location)
    } else {
        expect(actualLocation).toMatch(location)
    }
}

/**
 * Assert that a response is not a redirect
 */
export const expectNotRedirect = (response: Response) => {
    expect(response.status).not.toBe(307)
    expect(response.status).not.toBe(301)
    expect(response.status).not.toBe(302)
}

/**
 * Assert that a response has specific status and JSON body
 */
export const expectJsonResponse = async (
    response: Response,
    status: number,
    expectedBody: Record<string, unknown>
) => {
    expect(response.status).toBe(status)
    const body = await response.json()
    expect(body).toEqual(expectedBody)
}

// ============================================================================
// Mock Data Builders
// ============================================================================

/**
 * Create a mock admin audit log
 */
export const createMockAdminLog = (overrides?: Partial<{
    id: string
    adminId: string
    action: string
    resource: string | null
    details: string | null
    ipAddress: string
    userAgent: string
    success: boolean
    createdAt: Date
}>): Record<string, unknown> => ({
    id: 'log-123',
    adminId: 'admin-123',
    action: 'USER_VIEW',
    resource: 'user-456',
    details: null,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    success: true,
    createdAt: new Date(),
    ...overrides,
})

/**
 * Create mock admin object for auth tests
 */
export const createMockAdmin = (overrides?: Partial<{
    id: string
    email: string
    name: string
    role: string
    active: boolean
}>): Record<string, unknown> => ({
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
    active: true,
    ...overrides,
})
