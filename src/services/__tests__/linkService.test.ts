/**
 * @jest-environment node
 */
import { LinkService } from '../linkService'
import { prisma } from '@/lib/prisma'
import { checkUrlSafety } from '@/lib/safeBrowsing'
import bcrypt from 'bcryptjs'
import { createMockUser, createMockLink, createMockPrismaTransaction } from '@/__tests__/test-utils'
import { TEST_PASSWORD, TEST_HASHED_PASSWORD, TEST_TOO_SHORT_PASSWORD } from '@/__tests__/test-constants'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        $transaction: jest.fn(),
        link: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
    },
}))
jest.mock('@/lib/safeBrowsing')
jest.mock('bcryptjs')

describe('LinkService', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('createLink', () => {
        it('should create link with valid data', async () => {
            const mockUser = createMockUser({
                role: 'USER',
                monthlyLinksCreated: 0,
                totalLinks: 0,
            })

            const mockLink = createMockLink({
                shortUrl: 'abc123',
                longUrl: 'https://example.com',
                userId: mockUser.id,
            })

                ; (checkUrlSafety as jest.Mock).mockResolvedValue(true)
                ; (prisma.$transaction as jest.Mock).mockImplementation(createMockPrismaTransaction({
                    user: {
                        findUnique: jest.fn().mockResolvedValue(mockUser),
                        update: jest.fn().mockResolvedValue(mockUser),
                    },
                    link: {
                        findUnique: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockResolvedValue(mockLink),
                    },
                }))

            const result = await LinkService.createLink(mockUser.id, {
                longUrl: 'https://example.com',
            })

            expect(result).toBeDefined()
            expect(checkUrlSafety).toHaveBeenCalledWith('https://example.com')
        })

        it('should generate random short URL if custom not provided', async () => {
            const mockUser = createMockUser({
                monthlyLinksCreated: 0,
                totalLinks: 0,
            })

                ; (checkUrlSafety as jest.Mock).mockResolvedValue(true)
                ; (prisma.$transaction as jest.Mock).mockImplementation(createMockPrismaTransaction({
                    user: {
                        findUnique: jest.fn().mockResolvedValue(mockUser),
                        update: jest.fn().mockResolvedValue(mockUser),
                    },
                    link: {
                        findUnique: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockResolvedValue(createMockLink()),
                    },
                }))

            const result = await LinkService.createLink(mockUser.id, {
                longUrl: 'https://example.com',
            })

            expect(result).toBeDefined()
            expect(result.shortUrl).toBeTruthy()
        })

        it('should accept custom short URL', async () => {
            const mockUser = createMockUser({
                monthlyLinksCreated: 0,
                totalLinks: 0,
            })

            const customUrl = 'my-custom-link'
            const mockLink = createMockLink({
                shortUrl: customUrl,
                custom: true,
            })

                ; (checkUrlSafety as jest.Mock).mockResolvedValue(true)
                ; (prisma.$transaction as jest.Mock).mockImplementation(createMockPrismaTransaction({
                    user: {
                        findUnique: jest.fn().mockResolvedValue(mockUser),
                        update: jest.fn().mockResolvedValue(mockUser),
                    },
                    link: {
                        findUnique: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockResolvedValue(mockLink),
                    },
                }))

            const result = await LinkService.createLink(mockUser.id, {
                longUrl: 'https://example.com',
                customUrl: customUrl,
            })

            expect(result.shortUrl).toBe(customUrl)
            expect(result.custom).toBe(true)
        })

        it('should validate URL format', async () => {
            await expect(
                LinkService.createLink('user-123', {
                    longUrl: 'not-a-valid-url',
                })
            ).rejects.toThrow('URL tidak valid.')
        })

        it('should reject invalid URLs', async () => {
            await expect(
                LinkService.createLink('user-123', {
                    longUrl: 'invalid url with spaces',
                })
            ).rejects.toThrow('URL tidak valid.')
        })

        it('should reject URLs longer than 2048 characters', async () => {
            const longUrl = 'https://example.com/' + 'a'.repeat(2050)

            await expect(
                LinkService.createLink('user-123', {
                    longUrl: longUrl,
                })
            ).rejects.toThrow('URL terlalu panjang')
        })

        it('should check URL safety via Safe Browsing API', async () => {
            ; (checkUrlSafety as jest.Mock).mockResolvedValue(false)

            await expect(
                LinkService.createLink('user-123', {
                    longUrl: 'https://malicious-site.com',
                })
            ).rejects.toThrow('URL terdeteksi berbahaya.')

            expect(checkUrlSafety).toHaveBeenCalledWith('https://malicious-site.com')
        })

        it('should reject unsafe URLs', async () => {
            ; (checkUrlSafety as jest.Mock).mockResolvedValue(false)

            await expect(
                LinkService.createLink('user-123', {
                    longUrl: 'https://unsafe.com',
                })
            ).rejects.toThrow('URL terdeteksi berbahaya.')
        })

        it('should check custom URL format', async () => {
            const mockUser = createMockUser()

                ; (checkUrlSafety as jest.Mock).mockResolvedValue(true)
                ; (prisma.$transaction as jest.Mock).mockImplementation(createMockPrismaTransaction({
                    user: { findUnique: jest.fn().mockResolvedValue(mockUser) },
                    link: { findUnique: jest.fn() },
                }))

            await expect(
                LinkService.createLink('user-123', {
                    longUrl: 'https://example.com',
                    customUrl: 'invalid url!@#',
                })
            ).rejects.toThrow('Short URL kustom tidak valid.')
        })

        it('should reject reserved paths', async () => {
            const mockUser = createMockUser()

                ; (checkUrlSafety as jest.Mock).mockResolvedValue(true)
                ; (prisma.$transaction as jest.Mock).mockImplementation(createMockPrismaTransaction({
                    user: { findUnique: jest.fn().mockResolvedValue(mockUser) },
                    link: { findUnique: jest.fn() },
                }))

            await expect(
                LinkService.createLink('user-123', {
                    longUrl: 'https://example.com',
                    customUrl: 'dashboard',
                })
            ).rejects.toThrow('Short URL kustom tidak tersedia.')

            await expect(
                LinkService.createLink('user-123', {
                    longUrl: 'https://example.com',
                    customUrl: 'login',
                })
            ).rejects.toThrow('Short URL kustom tidak tersedia.')
        })

        it('should reject duplicate custom URLs', async () => {
            const mockUser = createMockUser()
            const existingLink = createMockLink({ shortUrl: 'taken' })

                ; (checkUrlSafety as jest.Mock).mockResolvedValue(true)
                ; (prisma.$transaction as jest.Mock).mockImplementation(createMockPrismaTransaction({
                    user: { findUnique: jest.fn().mockResolvedValue(mockUser) },
                    link: {
                        findUnique: jest.fn().mockResolvedValue(existingLink),
                    },
                }))

            await expect(
                LinkService.createLink('user-123', {
                    longUrl: 'https://example.com',
                    customUrl: 'taken',
                })
            ).rejects.toThrow('Short URL kustom sudah digunakan.')
        })

        it('should hash password if provided', async () => {
            const mockUser = createMockUser({
                monthlyLinksCreated: 0,
                totalLinks: 0,
            })

                ; (checkUrlSafety as jest.Mock).mockResolvedValue(true)
                ; (bcrypt.hash as jest.Mock).mockResolvedValue(TEST_HASHED_PASSWORD)

            let capturedLinkData: unknown = null
                ; (prisma.$transaction as jest.Mock).mockImplementation(createMockPrismaTransaction({
                    user: {
                        findUnique: jest.fn().mockResolvedValue(mockUser),
                        update: jest.fn().mockResolvedValue(mockUser),
                    },
                    link: {
                        findUnique: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockImplementation((data) => {
                            capturedLinkData = data
                            return createMockLink({ password: TEST_HASHED_PASSWORD })
                        }),
                    },
                }))

            await LinkService.createLink(mockUser.id, {
                longUrl: 'https://example.com',
                password: TEST_PASSWORD,
            })

            expect(bcrypt.hash).toHaveBeenCalledWith(TEST_PASSWORD, 12)
            expect((capturedLinkData as { data: { password: string } }).data.password).toBe(TEST_HASHED_PASSWORD)
        })

        it('should reject passwords shorter than 4 characters', async () => {
            const mockUser = createMockUser()

                ; (checkUrlSafety as jest.Mock).mockResolvedValue(true)
                ; (prisma.$transaction as jest.Mock).mockImplementation(createMockPrismaTransaction({
                    user: { findUnique: jest.fn().mockResolvedValue(mockUser) },
                    link: { findUnique: jest.fn() },
                }))

            await expect(
                LinkService.createLink('user-123', {
                    longUrl: 'https://example.com',
                    password: TEST_TOO_SHORT_PASSWORD,
                })
            ).rejects.toThrow('Password minimal 4 karakter.')
        })

        it('should check user exists', async () => {
            ; (checkUrlSafety as jest.Mock).mockResolvedValue(true)
                ; (prisma.$transaction as jest.Mock).mockImplementation(createMockPrismaTransaction({
                    user: { findUnique: jest.fn().mockResolvedValue(null) },
                }))

            await expect(
                LinkService.createLink('nonexistent-user', {
                    longUrl: 'https://example.com',
                })
            ).rejects.toThrow('User tidak ditemukan.')
        })

        it('should enforce monthly link limits for STUDENT (5)', async () => {
            const mockUser = createMockUser({
                role: 'STUDENT',
                monthlyLinksCreated: 5,
                totalLinks: 5,
            })

                ; (checkUrlSafety as jest.Mock).mockResolvedValue(true)
                ; (prisma.$transaction as jest.Mock).mockImplementation(createMockPrismaTransaction({
                    user: { findUnique: jest.fn().mockResolvedValue(mockUser) },
                }))

            await expect(
                LinkService.createLink(mockUser.id, {
                    longUrl: 'https://example.com',
                })
            ).rejects.toThrow('Batas link bulanan tercapai.')
        })

        it('should enforce monthly link limits for USER (10)', async () => {
            const mockUser = createMockUser({
                role: 'USER',
                monthlyLinksCreated: 10,
                totalLinks: 10,
            })

                ; (checkUrlSafety as jest.Mock).mockResolvedValue(true)
                ; (prisma.$transaction as jest.Mock).mockImplementation(createMockPrismaTransaction({
                    user: { findUnique: jest.fn().mockResolvedValue(mockUser) },
                }))

            await expect(
                LinkService.createLink(mockUser.id, {
                    longUrl: 'https://example.com',
                })
            ).rejects.toThrow('Batas link bulanan tercapai.')
        })

        it('should enforce total link limits for STUDENT (100)', async () => {
            const mockUser = createMockUser({
                role: 'STUDENT',
                monthlyLinksCreated: 0,
                totalLinks: 100,
            })

                ; (checkUrlSafety as jest.Mock).mockResolvedValue(true)
                ; (prisma.$transaction as jest.Mock).mockImplementation(createMockPrismaTransaction({
                    user: { findUnique: jest.fn().mockResolvedValue(mockUser) },
                }))

            await expect(
                LinkService.createLink(mockUser.id, {
                    longUrl: 'https://example.com',
                })
            ).rejects.toThrow('Batas total link tercapai.')
        })

        it('should enforce total link limits for USER (200)', async () => {
            const mockUser = createMockUser({
                role: 'USER',
                monthlyLinksCreated: 0,
                totalLinks: 200,
            })

                ; (checkUrlSafety as jest.Mock).mockResolvedValue(true)
                ; (prisma.$transaction as jest.Mock).mockImplementation(createMockPrismaTransaction({
                    user: { findUnique: jest.fn().mockResolvedValue(mockUser) },
                }))

            await expect(
                LinkService.createLink(mockUser.id, {
                    longUrl: 'https://example.com',
                })
            ).rejects.toThrow('Batas total link tercapai.')
        })

        it('should increment user counters', async () => {
            const mockUser = createMockUser({
                monthlyLinksCreated: 2,
                totalLinks: 10,
            })

            let userUpdateCalled = false
                ; (checkUrlSafety as jest.Mock).mockResolvedValue(true)
                ; (prisma.$transaction as jest.Mock).mockImplementation(createMockPrismaTransaction({
                    user: {
                        findUnique: jest.fn().mockResolvedValue(mockUser),
                        update: jest.fn().mockImplementation(() => {
                            userUpdateCalled = true
                            return mockUser
                        }),
                    },
                    link: {
                        findUnique: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockResolvedValue(createMockLink()),
                    },
                }))

            await LinkService.createLink(mockUser.id, {
                longUrl: 'https://example.com',
            })

            expect(userUpdateCalled).toBe(true)
        })
    })

    describe('getLinks', () => {
        it('should return paginated links', async () => {
            const mockLinks = [createMockLink(), createMockLink({ id: 'link-2' })]

                ; (prisma.link.count as jest.Mock).mockResolvedValue(2)
                ; (prisma.link.findMany as jest.Mock).mockResolvedValue(mockLinks)

            const result = await LinkService.getLinks('user-123')

            expect(result.links).toEqual(mockLinks)
            expect(result.pagination.total).toBe(2)
        })

        it('should filter by search term in shortUrl', async () => {
            ; (prisma.link.count as jest.Mock).mockResolvedValue(1)
                ; (prisma.link.findMany as jest.Mock).mockResolvedValue([])

            await LinkService.getLinks('user-123', { search: 'abc' })

            expect(prisma.link.count).toHaveBeenCalledWith({
                where: {
                    userId: 'user-123',
                    OR: [
                        { shortUrl: { contains: 'abc', mode: 'insensitive' } },
                        { longUrl: { contains: 'abc', mode: 'insensitive' } },
                    ],
                },
            })
        })

        it('should filter by active status', async () => {
            ; (prisma.link.count as jest.Mock).mockResolvedValue(1)
                ; (prisma.link.findMany as jest.Mock).mockResolvedValue([])

            await LinkService.getLinks('user-123', { active: true })

            expect(prisma.link.count).toHaveBeenCalledWith({
                where: {
                    userId: 'user-123',
                    active: true,
                },
            })
        })

        it('should sort by different fields', async () => {
            ; (prisma.link.count as jest.Mock).mockResolvedValue(0)
                ; (prisma.link.findMany as jest.Mock).mockResolvedValue([])

            await LinkService.getLinks('user-123', { sort: 'visitCount' })

            expect(prisma.link.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { visitCount: 'desc' },
                })
            )
        })

        it('should sort in asc order', async () => {
            ; (prisma.link.count as jest.Mock).mockResolvedValue(0)
                ; (prisma.link.findMany as jest.Mock).mockResolvedValue([])

            await LinkService.getLinks('user-123', { sort: 'shortUrl', order: 'asc' })

            expect(prisma.link.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { shortUrl: 'asc' },
                })
            )
        })

        it('should calculate pagination correctly', async () => {
            ; (prisma.link.count as jest.Mock).mockResolvedValue(25)
                ; (prisma.link.findMany as jest.Mock).mockResolvedValue([])

            const result = await LinkService.getLinks('user-123', { page: 2, limit: 10 })

            expect(result.pagination.page).toBe(2)
            expect(result.pagination.limit).toBe(10)
            expect(result.pagination.total).toBe(25)
            expect(result.pagination.totalPages).toBe(3)
            expect(result.pagination.hasNext).toBe(true)
            expect(result.pagination.hasPrev).toBe(true)
        })

        it('should return correct hasNext flag', async () => {
            ; (prisma.link.count as jest.Mock).mockResolvedValue(20)
                ; (prisma.link.findMany as jest.Mock).mockResolvedValue([])

            const resultPage1 = await LinkService.getLinks('user-123', { page: 1, limit: 10 })
            expect(resultPage1.pagination.hasNext).toBe(true)

            const resultPage2 = await LinkService.getLinks('user-123', { page: 2, limit: 10 })
            expect(resultPage2.pagination.hasNext).toBe(false)
        })

        it('should return correct hasPrev flag', async () => {
            ; (prisma.link.count as jest.Mock).mockResolvedValue(20)
                ; (prisma.link.findMany as jest.Mock).mockResolvedValue([])

            const resultPage1 = await LinkService.getLinks('user-123', { page: 1, limit: 10 })
            expect(resultPage1.pagination.hasPrev).toBe(false)

            const resultPage2 = await LinkService.getLinks('user-123', { page: 2, limit: 10 })
            expect(resultPage2.pagination.hasPrev).toBe(true)
        })
    })
})
