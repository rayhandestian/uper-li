/**
 * @jest-environment node
 */
import { GET } from '../links/public/[shortUrl]/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TEST_HASHED_PASSWORD } from '@/__tests__/test-constants'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        link: {
            findUnique: jest.fn(),
        },
    },
}))

jest.mock('@/lib/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}))

describe('/api/links/public/[shortUrl]', () => {
    const mockParams = { shortUrl: 'test123' }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('GET', () => {
        it('should return not_found when link does not exist', async () => {
            ; (prisma.link.findUnique as jest.Mock).mockResolvedValue(null)

            const req = new NextRequest('http://localhost/api/links/public/test123')
            const res = await GET(req, { params: Promise.resolve(mockParams) })
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data).toEqual({ status: 'not_found' })
            expect(prisma.link.findUnique).toHaveBeenCalledWith({
                where: { shortUrl: 'test123' }
            })
        })

        it('should return inactive when link exists but is not active', async () => {
            ; (prisma.link.findUnique as jest.Mock).mockResolvedValue({
                id: 'link-1',
                shortUrl: 'test123',
                longUrl: 'http://example.com',
                active: false,
                password: null,
                mode: 'DIRECT'
            })

            const req = new NextRequest('http://localhost/api/links/public/test123')
            const res = await GET(req, { params: Promise.resolve(mockParams) })
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data).toEqual({ status: 'inactive' })
        })

        it('should return locked when link has password', async () => {
            ; (prisma.link.findUnique as jest.Mock).mockResolvedValue({
                id: 'link-1',
                shortUrl: 'test123',
                longUrl: 'http://example.com',
                active: true,
                password: TEST_HASHED_PASSWORD,
                mode: 'DIRECT'
            })

            const req = new NextRequest('http://localhost/api/links/public/test123')
            const res = await GET(req, { params: Promise.resolve(mockParams) })
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data).toEqual({
                status: 'locked',
                longUrl: 'http://example.com'
            })
        })

        it('should return ok with link details when link is active and has no password', async () => {
            ; (prisma.link.findUnique as jest.Mock).mockResolvedValue({
                id: 'link-1',
                shortUrl: 'test123',
                longUrl: 'http://example.com',
                active: true,
                password: null,
                mode: 'DIRECT'
            })

            const req = new NextRequest('http://localhost/api/links/public/test123')
            const res = await GET(req, { params: Promise.resolve(mockParams) })
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data).toEqual({
                status: 'ok',
                longUrl: 'http://example.com',
                mode: 'DIRECT',
                id: 'link-1'
            })
        })

        it('should handle different link modes', async () => {
            ; (prisma.link.findUnique as jest.Mock).mockResolvedValue({
                id: 'link-1',
                shortUrl: 'test123',
                longUrl: 'http://example.com',
                active: true,
                password: null,
                mode: 'PROXY'
            })

            const req = new NextRequest('http://localhost/api/links/public/test123')
            const res = await GET(req, { params: Promise.resolve(mockParams) })
            const data = await res.json()

            expect(data).toEqual({
                status: 'ok',
                longUrl: 'http://example.com',
                mode: 'PROXY',
                id: 'link-1'
            })
        })

        it('should handle database errors gracefully', async () => {
            ; (prisma.link.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

            const req = new NextRequest('http://localhost/api/links/public/test123')

            // The route doesn't have explicit error handling, so it will throw
            await expect(GET(req, { params: Promise.resolve(mockParams) })).rejects.toThrow('Database error')
        })
    })
})