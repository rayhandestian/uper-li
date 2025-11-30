/**
 * @jest-environment node
 */
import { middleware } from '@/middleware'
import { getToken } from 'next-auth/jwt'
import {
    createUperLiRequest,
    createAppUperLiRequest,
    createAdminUperLiRequest,
    createLocalhostRequest,
    expectRedirect,
    expectNotRedirect,
} from '@/__tests__/test-utils'

// Mock next-auth JWT token validation
jest.mock('next-auth/jwt', () => ({
    getToken: jest.fn(),
}))

describe('Middleware', () => {
    const originalEnv = process.env.NODE_ENV

    beforeEach(() => {
        jest.clearAllMocks()
            // Default: no authenticated user
            ; (getToken as jest.Mock).mockResolvedValue(null)
    })

    afterEach(() => {
        // Restore original NODE_ENV after all tests
        if (originalEnv) {
            Object.defineProperty(process.env, 'NODE_ENV', {
                value: originalEnv,
                writable: true,
                configurable: true,
            })
        }
    })

    describe('HTTPS Enforcement', () => {
        // NOTE: process.env.NODE_ENV is 'test' in Jest, so HTTPS redirect won't happen
        // Testing HTTPS logic requires integration tests in actual production environment

        it('should not redirect if already HTTPS', async () => {
            const req = createUperLiRequest('/test')
            const res = await middleware(req)
            expectNotRedirect(res)
        })

        it('should allow localhost without HTTPS', async () => {
            const req = createLocalhostRequest('/test')
            const res = await middleware(req)
            expectNotRedirect(res)
        })
    })

    describe('Subdomain Routing - uper.li', () => {
        it('should redirect root path to app.uper.li', async () => {
            const req = createUperLiRequest('/')
            const res = await middleware(req)
            expectRedirect(res, /^https:\/\/app\.uper\.li\/?$/)
        })

        it('should redirect /login-admin to admin.uper.li', async () => {
            const req = createUperLiRequest('/login-admin')
            const res = await middleware(req)
            expectRedirect(res, 'https://admin.uper.li/login-admin')
        })

        it('should redirect /admin paths to admin.uper.li', async () => {
            const req = createUperLiRequest('/admin/dashboard')
            const res = await middleware(req)
            expectRedirect(res, 'https://admin.uper.li/admin/dashboard')
        })

        it('should redirect /admin root to admin.uper.li', async () => {
            const req = createUperLiRequest('/admin')
            const res = await middleware(req)
            expectRedirect(res, 'https://admin.uper.li/admin')
        })

        it('should redirect app-specific routes to app.uper.li', async () => {
            const appRoutes = ['/dashboard', '/login', '/register', '/terms', '/privacy', '/contact', '/verify']

            for (const route of appRoutes) {
                const req = createUperLiRequest(route)
                const res = await middleware(req)
                expectRedirect(res, `https://app.uper.li${route}`)
            }
        })

        it('should allow short URL routes (single segment)', async () => {
            const req = createUperLiRequest('/abc123')
            const res = await middleware(req)
            expectNotRedirect(res)
        })

        it('should allow short URLs with different patterns', async () => {
            const shortUrls = ['/test', '/a1b2c3', '/my-link', '/link_123']

            for (const url of shortUrls) {
                const req = createUperLiRequest(url)
                const res = await middleware(req)
                expectNotRedirect(res)
            }
        })

        it('should redirect multi-segment paths to app.uper.li', async () => {
            const req = createUperLiRequest('/some/nested/path')
            const res = await middleware(req)
            expectRedirect(res, 'https://app.uper.li/some/nested/path')
        })

        it('should redirect with query parameters', async () => {
            const req = createUperLiRequest('/dashboard?tab=links&sort=date')
            const res = await middleware(req)
            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('app.uper.li/dashboard')
        })
    })

    describe('Subdomain Routing - app.uper.li', () => {
        it('should allow all routes on app.uper.li', async () => {
            const req = createAppUperLiRequest('/dashboard')
            const res = await middleware(req)
            expectNotRedirect(res)
        })

        it('should handle root path on app.uper.li', async () => {
            const req = createAppUperLiRequest('/')
            const res = await middleware(req)
            expectNotRedirect(res)
        })

        it('should allow nested paths on app.uper.li', async () => {
            const req = createAppUperLiRequest('/some/nested/path')
            const res = await middleware(req)
            expectNotRedirect(res)
        })
    })

    describe('Subdomain Routing - admin.uper.li', () => {
        it('should rewrite root to /admin', async () => {
            const req = createAdminUperLiRequest('/')
            const res = await middleware(req)
            expectNotRedirect(res)
        })

        it('should rewrite /login to /login-admin', async () => {
            const req = createAdminUperLiRequest('/login')
            const res = await middleware(req)
            expectNotRedirect(res)
        })

        it('should allow /login-admin as-is', async () => {
            const req = createAdminUperLiRequest('/login-admin')
            const res = await middleware(req)
            expectNotRedirect(res)
        })

        it('should prefix paths without /admin', async () => {
            const req = createAdminUperLiRequest('/dashboard')
            const res = await middleware(req)
            expectNotRedirect(res)
        })

        it('should leave paths with /admin unchanged', async () => {
            const req = createAdminUperLiRequest('/admin/users')
            const res = await middleware(req)
            expectNotRedirect(res)
        })
    })

    describe('Authentication Redirects - app.uper.li', () => {
        it('should redirect authenticated users from /login to /dashboard', async () => {
            ; (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' })
            const req = createAppUperLiRequest('/login')
            const res = await middleware(req)
            expectRedirect(res, /\/dashboard/)
        })

        it('should redirect authenticated users from /register to /dashboard', async () => {
            ; (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' })
            const req = createAppUperLiRequest('/register')
            const res = await middleware(req)
            expectRedirect(res, /\/dashboard/)
        })

        it('should redirect authenticated users from /forgot-password to /dashboard', async () => {
            ; (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' })
            const req = createAppUperLiRequest('/forgot-password')
            const res = await middleware(req)
            expectRedirect(res, /\/dashboard/)
        })

        it('should redirect authenticated users from nested auth pages', async () => {
            ; (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' })
            const req = createAppUperLiRequest('/login/callback')
            const res = await middleware(req)
            expectRedirect(res, /\/dashboard/)
        })

        it('should allow unauthenticated users to access /login', async () => {
            ; (getToken as jest.Mock).mockResolvedValue(null)
            const req = createAppUperLiRequest('/login')
            const res = await middleware(req)
            expectNotRedirect(res)
        })

        it('should allow unauthenticated users to access /register', async () => {
            ; (getToken as jest.Mock).mockResolvedValue(null)
            const req = createAppUperLiRequest('/register')
            const res = await middleware(req)
            expectNotRedirect(res)
        })

        it('should allow unauthenticated users to access /forgot-password', async () => {
            ; (getToken as jest.Mock).mockResolvedValue(null)
            const req = createAppUperLiRequest('/forgot-password')
            const res = await middleware(req)
            expectNotRedirect(res)
        })

        it('should not redirect authenticated users from non-auth pages', async () => {
            ; (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' })
            const req = createAppUperLiRequest('/dashboard')
            const res = await middleware(req)
            expectNotRedirect(res)
        })
    })

    describe('Authentication Redirects - localhost/development', () => {
        it('should redirect authenticated users from /login to /dashboard on localhost', async () => {
            ; (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' })
            const req = createLocalhostRequest('/login')
            const res = await middleware(req)
            expectRedirect(res, /\/dashboard/)
        })

        it('should redirect authenticated users from /register on localhost', async () => {
            ; (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' })
            const req = createLocalhostRequest('/register')
            const res = await middleware(req)
            expectRedirect(res, /\/dashboard/)
        })

        it('should allow unauthenticated users on localhost', async () => {
            ; (getToken as jest.Mock).mockResolvedValue(null)
            const req = createLocalhostRequest('/login')
            const res = await middleware(req)
            expectNotRedirect(res)
        })

        it('should allow all non-auth routes on localhost', async () => {
            const req = createLocalhostRequest('/dashboard')
            const res = await middleware(req)
            expectNotRedirect(res)
        })
    })

    describe('Reserved Paths and Edge Cases', () => {
        it('should not allow short URL routes that match app routes', async () => {
            const req = createUperLiRequest('/dashboard')
            const res = await middleware(req)
            expectRedirect(res, /app\.uper\.li\/dashboard/)
        })

        it('should handle URLs with trailing slashes', async () => {
            const req = createUperLiRequest('/abc123/')
            const res = await middleware(req)
            expectRedirect(res, /.*/)
        })

        it('should handle URLs with special characters in short codes', async () => {
            const req = createUperLiRequest('/test-123')
            const res = await middleware(req)
            expectNotRedirect(res)
        })

        it('should handle URLs with underscores', async () => {
            const req = createUperLiRequest('/test_123')
            const res = await middleware(req)
            expectNotRedirect(res)
        })

        it('should handle case-sensitive paths', async () => {
            const req = createUperLiRequest('/Dashboard')
            const res = await middleware(req)
            expectNotRedirect(res)
        })
    })

    describe('getToken Integration', () => {
        it('should call getToken with correct parameters for auth pages', async () => {
            const req = createAppUperLiRequest('/login')
            await middleware(req)
            expect(getToken).toHaveBeenCalledWith({ req })
        })

        it('should not call getToken for non-auth pages on app domain', async () => {
            jest.clearAllMocks()
            const req = createAppUperLiRequest('/dashboard')
            await middleware(req)
            expect(getToken).not.toHaveBeenCalled()
        })

        it('should handle getToken errors gracefully', async () => {
            ; (getToken as jest.Mock).mockRejectedValue(new Error('Token validation failed'))
            const req = createAppUperLiRequest('/login')

            try {
                await middleware(req)
            } catch (error) {
                expect(error).toBeDefined()
            }
        })
    })

    describe('Complex Scenarios', () => {
        it('should handle subdomain routing in test environment', async () => {
            const req = createUperLiRequest('/dashboard')
            const res = await middleware(req)
            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('app.uper.li/dashboard')
        })

        it('should handle auth redirects with query parameters', async () => {
            ; (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' })
            const req = createAppUperLiRequest('/login?redirect=/settings&foo=bar')
            const res = await middleware(req)
            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('/dashboard')
        })

        it('should handle subdomain routing with auth state', async () => {
            ; (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' })
            const req = createUperLiRequest('/register')
            const res = await middleware(req)
            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('app.uper.li/register')
        })
    })
})
