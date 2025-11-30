/**
 * @jest-environment node
 */
import { POST } from '../verify-link-password/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { TEST_HASHED_PASSWORD, TEST_PASSWORD, TEST_WRONG_PASSWORD } from '@/__tests__/test-constants'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        link: {
            findUnique: jest.fn(),
        },
    },
}))

jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}))

jest.mock('@/lib/rateLimit', () => ({
    withRateLimit: jest.fn((handler) => handler),
}))

jest.mock('@/lib/timing', () => ({
    addConstantDelay: jest.fn().mockResolvedValue(undefined),
}))

describe('/api/verify-link-password', () => {
    beforeEach(() => {
        jest.clearAllMocks()
            // Setup default bcrypt.hash mock for dummy hash
            ; (bcrypt.hash as jest.Mock).mockResolvedValue('dummy_hash')
    })

    it('should return 401 with generic error if shortUrl or password is missing', async () => {
        const req = new NextRequest('http://localhost/api/verify-link-password', {
            method: 'POST',
            body: JSON.stringify({}),
        })
        const res = await POST(req)
        expect(res.status).toBe(401)
        expect(await res.json()).toEqual({ error: 'Verifikasi gagal.' })
    })

    it('should return 401 with generic error if link not found', async () => {
        ; (prisma.link.findUnique as jest.Mock).mockResolvedValue(null)
            ; (bcrypt.compare as jest.Mock).mockResolvedValue(false)

        const req = new NextRequest('http://localhost/api/verify-link-password', {
            method: 'POST',
            body: JSON.stringify({ shortUrl: 'nonexistent', password: TEST_PASSWORD }),
        })
        const res = await POST(req)

        expect(res.status).toBe(401)
        expect(await res.json()).toEqual({ error: 'Verifikasi gagal.' })
        // Verify bcrypt.compare was called (for timing normalization)
        expect(bcrypt.compare).toHaveBeenCalled()
    })

    it('should return 401 with generic error if link has no password', async () => {
        ; (prisma.link.findUnique as jest.Mock).mockResolvedValue({
            id: 'link-id',
            shortUrl: 'test',
            password: null
        })
            ; (bcrypt.compare as jest.Mock).mockResolvedValue(false)

        const req = new NextRequest('http://localhost/api/verify-link-password', {
            method: 'POST',
            body: JSON.stringify({ shortUrl: 'test', password: TEST_PASSWORD }),
        })
        const res = await POST(req)

        expect(res.status).toBe(401)
        expect(await res.json()).toEqual({ error: 'Verifikasi gagal.' })
        // Verify bcrypt operations were called for timing normalization
        expect(bcrypt.hash).toHaveBeenCalled()
        expect(bcrypt.compare).toHaveBeenCalled()
    })

    it('should return 401 with generic error if password is incorrect', async () => {
        ; (prisma.link.findUnique as jest.Mock).mockResolvedValue({
            id: 'link-id',
            shortUrl: 'test',
            password: TEST_HASHED_PASSWORD
        })
            ; (bcrypt.compare as jest.Mock).mockResolvedValue(false)

        const req = new NextRequest('http://localhost/api/verify-link-password', {
            method: 'POST',
            body: JSON.stringify({ shortUrl: 'test', password: TEST_WRONG_PASSWORD }),
        })
        const res = await POST(req)

        expect(res.status).toBe(401)
        expect(await res.json()).toEqual({ error: 'Verifikasi gagal.' })
    })

    it('should return success if password is correct', async () => {
        ; (prisma.link.findUnique as jest.Mock).mockResolvedValue({
            id: 'link-id',
            shortUrl: 'test',
            password: TEST_HASHED_PASSWORD
        })
            ; (bcrypt.compare as jest.Mock).mockResolvedValue(true)

        const req = new NextRequest('http://localhost/api/verify-link-password', {
            method: 'POST',
            body: JSON.stringify({ shortUrl: 'test', password: TEST_PASSWORD }),
        })
        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({ success: true })
    })

    it('should perform timing normalization for all error cases', async () => {
        const { addConstantDelay } = await import('@/lib/timing')

            // Test case 1: Link not found
            ; (prisma.link.findUnique as jest.Mock).mockResolvedValue(null)
            ; (bcrypt.compare as jest.Mock).mockResolvedValue(false)

        let req = new NextRequest('http://localhost/api/verify-link-password', {
            method: 'POST',
            body: JSON.stringify({ shortUrl: 'nonexistent', password: 'test' }),
        })
        await POST(req)
        expect(addConstantDelay).toHaveBeenCalled()

        jest.clearAllMocks()

            // Test case 2: Wrong password
            ; (prisma.link.findUnique as jest.Mock).mockResolvedValue({
                id: 'link-id',
                shortUrl: 'test',
                password: 'hashed'
            })
            ; (bcrypt.compare as jest.Mock).mockResolvedValue(false)

        req = new NextRequest('http://localhost/api/verify-link-password', {
            method: 'POST',
            body: JSON.stringify({ shortUrl: 'test', password: TEST_WRONG_PASSWORD }),
        })
        await POST(req)
        expect(addConstantDelay).toHaveBeenCalled()
    })
})
