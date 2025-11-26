/**
 * @jest-environment node
 */
import { POST } from '../links/log-visit/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        link: {
            update: jest.fn(),
        },
    },
}))

describe('/api/links/log-visit', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return 400 if linkId is missing', async () => {
        const req = new NextRequest('http://localhost/api/links/log-visit', {
            method: 'POST',
            body: JSON.stringify({}),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Link ID required' })
    })

    it('should log visit successfully', async () => {
        (prisma.link.update as jest.Mock).mockResolvedValue({ id: 'link-123' })

        const req = new NextRequest('http://localhost/api/links/log-visit', {
            method: 'POST',
            body: JSON.stringify({ linkId: 'link-123' }),
        })
        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(prisma.link.update).toHaveBeenCalledWith({
            where: { id: 'link-123' },
            data: {
                visitCount: { increment: 1 },
                lastVisited: expect.any(Date)
            }
        })
        expect(await res.json()).toEqual({ success: true })
    })
})
