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

        it('should return 400 if total limit reached', async () => {
            (checkUrlSafety as jest.Mock).mockResolvedValue(true)

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                    id: 'user-123',
                    role: 'STUDENT',
                    monthlyLinksCreated: 0,
                    totalLinks: 100, // Limit is 100 for STUDENT
                })

            const req = new NextRequest('http://localhost/api/links', {
                method: 'POST',
                body: JSON.stringify(validBody),
            })
            const res = await POST(req)

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Batas total link tercapai.' })
        })

        it('should return 400 if URL format is invalid', async () => {
            const req = new NextRequest('http://localhost/api/links', {
                method: 'POST',
                body: JSON.stringify({ longUrl: 'not-a-valid-url' }),
            })
            const res = await POST(req)
            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'URL tidak valid.' })
        })

        it('should return 400 if URL is too long', async () => {
            const longUrl = 'http://example.com/' + 'a'.repeat(2050)
            const req = new NextRequest('http://localhost/api/links', {
                method: 'POST',
                body: JSON.stringify({ longUrl }),
            })
            const res = await POST(req)
            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'URL terlalu panjang (max 2048 karakter).' })
        })

        it('should create link with custom URL', async () => {
            (checkUrlSafety as jest.Mock).mockResolvedValue(true)

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                    id: 'user-123',
                    role: 'USER',
                    monthlyLinksCreated: 0,
                    totalLinks: 0,
                })
                ; (prisma.link.findUnique as jest.Mock).mockResolvedValue(null)
                ; (prisma.link.create as jest.Mock).mockResolvedValue({
                    id: 'new-link',
                    shortUrl: 'custom123',
                    longUrl: 'http://example.com',
                })

            const req = new NextRequest('http://localhost/api/links', {
                method: 'POST',
                body: JSON.stringify({ ...validBody, customUrl: 'custom123' }),
            })
            const res = await POST(req)

            expect(res.status).toBe(200)
            expect(prisma.link.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        shortUrl: 'custom123',
                        custom: true,
                    }),
                })
            )
        })

        it('should return 400 if custom URL is invalid', async () => {
            (checkUrlSafety as jest.Mock).mockResolvedValue(true)

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                    id: 'user-123',
                    role: 'USER',
                    monthlyLinksCreated: 0,
                    totalLinks: 0,
                })

            const req = new NextRequest('http://localhost/api/links', {
                method: 'POST',
                body: JSON.stringify({ ...validBody, customUrl: 'invalid@url!' }),
            })
            const res = await POST(req)

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Short URL kustom tidak valid.' })
        })

        it('should return 400 if custom URL is reserved', async () => {
            (checkUrlSafety as jest.Mock).mockResolvedValue(true)

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                    id: 'user-123',
                    role: 'USER',
                    monthlyLinksCreated: 0,
                    totalLinks: 0,
                })

            const req = new NextRequest('http://localhost/api/links', {
                method: 'POST',
                body: JSON.stringify({ ...validBody, customUrl: 'dashboard' }),
            })
            const res = await POST(req)

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Short URL kustom tidak tersedia.' })
        })

        it('should return 400 if custom URL is already taken', async () => {
            (checkUrlSafety as jest.Mock).mockResolvedValue(true)

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                    id: 'user-123',
                    role: 'USER',
                    monthlyLinksCreated: 0,
                    totalLinks: 0,
                })
                ; (prisma.link.findUnique as jest.Mock).mockResolvedValue({
                    id: 'existing-link',
                    shortUrl: 'taken',
                })

            const req = new NextRequest('http://localhost/api/links', {
                method: 'POST',
                body: JSON.stringify({ ...validBody, customUrl: 'taken' }),
            })
            const res = await POST(req)

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Short URL kustom sudah digunakan.' })
        })

        it('should create link with password protection', async () => {
            (checkUrlSafety as jest.Mock).mockResolvedValue(true)

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                    id: 'user-123',
                    role: 'USER',
                    monthlyLinksCreated: 0,
                    totalLinks: 0,
                })
                ; (prisma.link.findUnique as jest.Mock).mockResolvedValue(null)
                ; (prisma.link.create as jest.Mock).mockResolvedValue({
                    id: 'new-link',
                    shortUrl: 'abc123',
                    longUrl: 'http://example.com',
                })

            const req = new NextRequest('http://localhost/api/links', {
                method: 'POST',
                body: JSON.stringify({ ...validBody, password: 'secure123' }),
            })
            const res = await POST(req)

            expect(res.status).toBe(200)
            expect(prisma.link.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        password: expect.any(String), // Hashed password
                    }),
                })
            )
        })

        it('should return 400 if password is too short', async () => {
            (checkUrlSafety as jest.Mock).mockResolvedValue(true)

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                    id: 'user-123',
                    role: 'USER',
                    monthlyLinksCreated: 0,
                    totalLinks: 0,
                })

            const req = new NextRequest('http://localhost/api/links', {
                method: 'POST',
                body: JSON.stringify({ ...validBody, password: '123' }), // Less than 4 chars
            })
            const res = await POST(req)

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Password minimal 4 karakter.' })
        })
    })
})
