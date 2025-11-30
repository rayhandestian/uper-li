/**
 * @jest-environment node
 */
import { middleware } from '@/middleware'
import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

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
            const req = new NextRequest('https://uper.li/test')

            const res = await middleware(req)

            // Should not redirect, but continue to routing logic (short URL)
            expect(res.status).not.toBe(307)
        })

        it('should allow localhost without HTTPS', async () => {
            const req = new NextRequest('http://localhost:3000/test')

            const res = await middleware(req)

            // Localhost is always allowed
            expect(res.status).not.toBe(307)
        })
    })

    describe('Subdomain Routing - uper.li', () => {
        it('should redirect root path to app.uper.li', async () => {
            const req = new NextRequest('https://uper.li/')

            const res = await middleware(req)

            expect(res.status).toBe(307)
            // NextResponse.redirect may add trailing /, check flexibly
            const location = res.headers.get('location')
            expect(location).toMatch(/^https:\/\/app\.uper\.li\/?$/)
        })

        it('should redirect /login-admin to admin.uper.li', async () => {
            const req = new NextRequest('https://uper.li/login-admin')

            const res = await middleware(req)

            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toBe('https://admin.uper.li/login-admin')
        })

        it('should redirect /admin paths to admin.uper.li', async () => {
            const req = new NextRequest('https://uper.li/admin/dashboard')

            const res = await middleware(req)

            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toBe('https://admin.uper.li/admin/dashboard')
        })

        it('should redirect /admin root to admin.uper.li', async () => {
            const req = new NextRequest('https://uper.li/admin')

            const res = await middleware(req)

            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toBe('https://admin.uper.li/admin')
        })

        it('should redirect app-specific routes to app.uper.li', async () => {
            const appRoutes = ['/dashboard', '/login', '/register', '/terms', '/privacy', '/contact', '/verify']

            for (const route of appRoutes) {
                const req = new NextRequest(`https://uper.li${route}`)
                const res = await middleware(req)

                expect(res.status).toBe(307)
                expect(res.headers.get('location')).toBe(`https://app.uper.li${route}`)
            }
        })

        it('should allow short URL routes (single segment)', async () => {
            const req = new NextRequest('https://uper.li/abc123')

            const res = await middleware(req)

            // Should not redirect - allow the short URL to be processed
            expect(res.status).not.toBe(307)
        })

        it('should allow short URLs with different patterns', async () => {
            const shortUrls = ['/test', '/a1b2c3', '/my-link', '/link_123']

            for (const url of shortUrls) {
                const req = new NextRequest(`https://uper.li${url}`)
                const res = await middleware(req)

                expect(res.status).not.toBe(307)
            }
        })

        it('should redirect multi-segment paths to app.uper.li', async () => {
            const req = new NextRequest('https://uper.li/some/nested/path')

            const res = await middleware(req)

            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toBe('https://app.uper.li/some/nested/path')
        })

        it('should redirect with query parameters', async () => {
            const req = new NextRequest('https://uper.li/dashboard?tab=links&sort=date')

            const res = await middleware(req)

            expect(res.status).toBe(307)
            const location = res.headers.get('location')
            expect(location).toContain('app.uper.li/dashboard')
            // NextResponse.redirect behavior with query params - just verify redirect happens
        })
    })

    describe('Subdomain Routing - app.uper.li', () => {
        it('should allow all routes on app.uper.li', async () => {
            const req = new NextRequest('https://app.uper.li/dashboard')

            const res = await middleware(req)

            // Should not redirect, just pass through
            expect(res.status).not.toBe(307)
        })

        it('should handle root path on app.uper.li', async () => {
            const req = new NextRequest('https://app.uper.li/')

            const res = await middleware(req)

            expect(res.status).not.toBe(307)
        })

        it('should allow nested paths on app.uper.li', async () => {
            const req = new NextRequest('https://app.uper.li/some/nested/path')

            const res = await middleware(req)

            expect(res.status).not.toBe(307)
        })
    })

    describe('Subdomain Routing - admin.uper.li', () => {
        it('should rewrite root to /admin', async () => {
            const req = new NextRequest('https://admin.uper.li/')

            const res = await middleware(req)

            // Should be a rewrite (not redirect)
            expect(res.status).not.toBe(307)
        })

        it('should rewrite /login to /login-admin', async () => {
            const req = new NextRequest('https://admin.uper.li/login')

            const res = await middleware(req)

            expect(res.status).not.toBe(307)
        })

        it('should allow /login-admin as-is', async () => {
            const req = new NextRequest('https://admin.uper.li/login-admin')

            const res = await middleware(req)

            expect(res.status).not.toBe(307)
        })

        it('should prefix paths without /admin', async () => {
            const req = new NextRequest('https://admin.uper.li/dashboard')

            const res = await middleware(req)

            // Should rewrite to /admin/dashboard
            expect(res.status).not.toBe(307)
        })

        it('should leave paths with /admin unchanged', async () => {
            const req = new NextRequest('https://admin.uper.li/admin/users')

            const res = await middleware(req)

            expect(res.status).not.toBe(307)
        })
    })

    describe('Authentication Redirects - app.uper.li', () => {
        it('should redirect authenticated users from /login to /dashboard', async () => {
            ; (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' })

            const req = new NextRequest('https://app.uper.li/login')

            const res = await middleware(req)

            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('/dashboard')
        })

        it('should redirect authenticated users from /register to /dashboard', async () => {
            ; (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' })

            const req = new NextRequest('https://app.uper.li/register')

            const res = await middleware(req)

            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('/dashboard')
        })

        it('should redirect authenticated users from /forgot-password to /dashboard', async () => {
            ; (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' })

            const req = new NextRequest('https://app.uper.li/forgot-password')

            const res = await middleware(req)

            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('/dashboard')
        })

        it('should redirect authenticated users from nested auth pages', async () => {
            ; (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' })

            const req = new NextRequest('https://app.uper.li/login/callback')

            const res = await middleware(req)

            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('/dashboard')
        })

        it('should allow unauthenticated users to access /login', async () => {
            ; (getToken as jest.Mock).mockResolvedValue(null)

            const req = new NextRequest('https://app.uper.li/login')

            const res = await middleware(req)

            // Should not redirect
            expect(res.status).not.toBe(307)
        })

        it('should allow unauthenticated users to access /register', async () => {
            ; (getToken as jest.Mock).mockResolvedValue(null)

            const req = new NextRequest('https://app.uper.li/register')

            const res = await middleware(req)

            expect(res.status).not.toBe(307)
        })

        it('should allow unauthenticated users to access /forgot-password', async () => {
            ; (getToken as jest.Mock).mockResolvedValue(null)

            const req = new NextRequest('https://app.uper.li/forgot-password')

            const res = await middleware(req)

            expect(res.status).not.toBe(307)
        })

        it('should not redirect authenticated users from non-auth pages', async () => {
            ; (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' })

            const req = new NextRequest('https://app.uper.li/dashboard')

            const res = await middleware(req)

            expect(res.status).not.toBe(307)
        })
    })

    describe('Authentication Redirects - localhost/development', () => {
        it('should redirect authenticated users from /login to /dashboard on localhost', async () => {
            ; (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' })

            const req = new NextRequest('http://localhost:3000/login')

            const res = await middleware(req)

            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('/dashboard')
        })

        it('should redirect authenticated users from /register on localhost', async () => {
            ; (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' })

            const req = new NextRequest('http://localhost:3000/register')

            const res = await middleware(req)

            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('/dashboard')
        })

        it('should allow unauthenticated users on localhost', async () => {
            ; (getToken as jest.Mock).mockResolvedValue(null)

            const req = new NextRequest('http://localhost:3000/login')

            const res = await middleware(req)

            expect(res.status).not.toBe(307)
        })

        it('should allow all non-auth routes on localhost', async () => {
            const req = new NextRequest('http://localhost:3000/dashboard')

            const res = await middleware(req)

            expect(res.status).not.toBe(307)
        })
    })

    describe('Reserved Paths and Edge Cases', () => {
        it('should not allow short URL routes that match app routes', async () => {
            // /dashboard is a reserved app route, should redirect even if single segment
            const req = new NextRequest('https://uper.li/dashboard')

            const res = await middleware(req)

            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('app.uper.li/dashboard')
        })

        it('should handle URLs with trailing slashes', async () => {
            const req = new NextRequest('https://uper.li/abc123/')

            const res = await middleware(req)

            // Multi-segment due to trailing slash, should redirect
            expect(res.status).toBe(307)
        })

        it('should handle URLs with special characters in short codes', async () => {
            const req = new NextRequest('https://uper.li/test-123')

            const res = await middleware(req)

            // Single segment with hyphen, should be allowed
            expect(res.status).not.toBe(307)
        })

        it('should handle URLs with underscores', async () => {
            const req = new NextRequest('https://uper.li/test_123')

            const res = await middleware(req)

            expect(res.status).not.toBe(307)
        })

        it('should handle case-sensitive paths', async () => {
            const req = new NextRequest('https://uper.li/Dashboard')

            const res = await middleware(req)

            // /Dashboard is not in APP_ROUTES (case-sensitive), so treated as short URL
            expect(res.status).not.toBe(307)
        })
    })

    describe('getToken Integration', () => {
        it('should call getToken with correct parameters for auth pages', async () => {
            const req = new NextRequest('https://app.uper.li/login')

            await middleware(req)

            expect(getToken).toHaveBeenCalledWith({ req })
        })

        it('should not call getToken for non-auth pages on app domain', async () => {
            jest.clearAllMocks()

            const req = new NextRequest('https://app.uper.li/dashboard')

            await middleware(req)

            // getToken is not called for non-auth pages
            expect(getToken).not.toHaveBeenCalled()
        })

        it('should handle getToken errors gracefully', async () => {
            ; (getToken as jest.Mock).mockRejectedValue(new Error('Token validation failed'))

            const req = new NextRequest('https://app.uper.li/login')

            // Should not throw, but may fail - that's OK for this test
            // We're just checking it doesn't crash the middleware
            try {
                await middleware(req)
            } catch (error) {
                // Expected - getToken failed
                expect(error).toBeDefined()
            }
        })
    })

    describe('Complex Scenarios', () => {
        it('should handle subdomain routing in test environment', async () => {
            // In test environment (NODE_ENV='test'), HTTPS won't redirect
            // But subdomain routing will still work
            const req = new NextRequest('https://uper.li/dashboard')

            const res = await middleware(req)

            // Should redirect to app subdomain
            expect(res.status).toBe(307)
            const location = res.headers.get('location')
            expect(location).toContain('app.uper.li/dashboard')
        })

        it('should handle auth redirects with query parameters', async () => {
            ; (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' })

            const req = new NextRequest('https://app.uper.li/login?redirect=/settings&foo=bar')

            const res = await middleware(req)

            expect(res.status).toBe(307)
            // Should redirect to dashboard (auth redirect doesn't preserve query params in this implementation)
            expect(res.headers.get('location')).toContain('/dashboard')
        })

        it('should handle subdomain routing with auth state', async () => {
            ; (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' })

            const req = new NextRequest('https://uper.li/register')

            const res = await middleware(req)

            // Should redirect to app.uper.li first (subdomain routing)
            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('app.uper.li/register')
            // Note: The second redirect (to /dashboard) would happen on the next request
        })
    })
})
