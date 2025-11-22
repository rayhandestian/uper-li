/**
 * @jest-environment node
 */
import { GET, POST } from '../links/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkUrlSafety } from '@/lib/safeBrowsing'

// Mock dependencies
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
    authOptions: {},
}))

jest.mock('@/lib/prisma', () => ({
    prisma: {
        $queryRawUnsafe: jest.fn(),
        $transaction: jest.fn((callback) => callback(prisma)),
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        link: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}))

jest.mock('@/lib/safeBrowsing', () => ({
    checkUrlSafety: jest.fn(),
}))

// Import getServerSession after mocking
import { getServerSession } from 'next-auth'

describe('/api/links', () => {
    const mockSession = {
        user: {
            id: 'user-123',
            role: 'USER',
        },
    }

    beforeEach(() => {
        jest.clearAllMocks()
            ; (getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    describe('GET', () => {
        it('should return 401 if not authenticated', async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null)
            const req = new NextRequest('http://localhost/api/links')
            const res = await GET(req)
            expect(res.status).toBe(401)
        })

        it('should fetch links with pagination', async () => {
            const mockLinks = [{ id: 'link-1', shortUrl: 'abc', longUrl: 'http://example.com' }]
            const mockCount = [{ total: 10n }] // BigInt for count

                ; (prisma.$queryRawUnsafe as jest.Mock)
                    .mockResolvedValueOnce(mockCount) // First call for count
                    .mockResolvedValueOnce(mockLinks) // Second call for data

            const req = new NextRequest('http://localhost/api/links?page=1&limit=10')
            const res = await GET(req)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.links).toEqual(mockLinks)
            expect(data.pagination.total).toBe(10)
        })
    })

    describe('POST', () => {
        const validBody = {
            longUrl: 'http://example.com',
        }

        it('should return 401 if not authenticated', async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null)
            const req = new NextRequest('http://localhost/api/links', {
                method: 'POST',
                body: JSON.stringify(validBody),
            })
            const res = await POST(req)
            expect(res.status).toBe(401)
        })

        it('should return 400 if longUrl is missing', async () => {
            const req = new NextRequest('http://localhost/api/links', {
                method: 'POST',
                body: JSON.stringify({}),
            })
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it('should return 400 if URL is unsafe', async () => {
            (checkUrlSafety as jest.Mock).mockResolvedValue(false)
            const req = new NextRequest('http://localhost/api/links', {
                method: 'POST',
                body: JSON.stringify(validBody),
            })
            const res = await POST(req)
            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'URL terdeteksi berbahaya.' })
        })

        it('should create a link successfully', async () => {
            (checkUrlSafety as jest.Mock).mockResolvedValue(true)

                // Mock transaction calls
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                    id: 'user-123',
                    role: 'USER',
                    monthlyLinksCreated: 0,
                    totalLinks: 0,
                })
                ; (prisma.link.findUnique as jest.Mock).mockResolvedValue(null) // No collision
                ; (prisma.link.create as jest.Mock).mockResolvedValue({
                    id: 'new-link',
                    ...validBody,
                    shortUrl: 'random',
                })

            const req = new NextRequest('http://localhost/api/links', {
                method: 'POST',
                body: JSON.stringify(validBody),
            })
            const res = await POST(req)

            expect(res.status).toBe(200)
            expect(prisma.link.create).toHaveBeenCalled()
            expect(prisma.user.update).toHaveBeenCalled()
        })

        it('should return 400 if monthly limit reached', async () => {
            (checkUrlSafety as jest.Mock).mockResolvedValue(true)

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                    id: 'user-123',
                    role: 'STUDENT',
                    monthlyLinksCreated: 5, // Limit is 5
                    totalLinks: 10,
                })

            const req = new NextRequest('http://localhost/api/links', {
                method: 'POST',
                body: JSON.stringify(validBody),
            })
            const res = await POST(req)

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Batas link bulanan tercapai.' })
        })
    })
})
