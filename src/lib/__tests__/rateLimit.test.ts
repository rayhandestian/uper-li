/**
 * @jest-environment node
 */
import { withRateLimit } from '../rateLimit'
import { NextRequest, NextResponse } from 'next/server'

// Mock prisma
jest.mock('../prisma', () => ({
    prisma: {
        rateLimit: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
        },
    },
}))

import { prisma } from '../prisma'

describe('withRateLimit', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should pass all arguments to the handler', async () => {
        // Mock successful rate limit check
        ; (prisma.rateLimit.findUnique as jest.Mock).mockResolvedValue(null)
            ; (prisma.rateLimit.upsert as jest.Mock).mockResolvedValue({
                count: 1,
                resetTime: new Date(Date.now() + 1000),
            })

        const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }))
        const wrappedHandler = withRateLimit(handler)

        const req = new NextRequest('http://localhost')
        const context = { params: { slug: 'test' } }
        const extraArg = 'extra'

        await wrappedHandler(req, context, extraArg)

        expect(handler).toHaveBeenCalledWith(req, context, extraArg)
    })

    it('should return 429 if rate limit exceeded', async () => {
        const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }))
        const wrappedHandler = withRateLimit(handler, { limit: 1, windowMs: 1000 })

        const req = new NextRequest('http://localhost', { headers: { 'x-forwarded-for': '1.2.3.4' } })

            // First request - allowed
            ; (prisma.rateLimit.findUnique as jest.Mock).mockResolvedValue(null)
            ; (prisma.rateLimit.upsert as jest.Mock).mockResolvedValue({
                count: 1,
                resetTime: new Date(Date.now() + 1000),
            })

        const res1 = await wrappedHandler(req)
        expect(res1.status).toBe(200)

            // Second request - blocked
            ; (prisma.rateLimit.findUnique as jest.Mock).mockResolvedValue({
                count: 1,
                resetTime: new Date(Date.now() + 1000),
            })

        const res2 = await wrappedHandler(req)
        expect(res2.status).toBe(429)
        expect(handler).toHaveBeenCalledTimes(1)
    })
})
