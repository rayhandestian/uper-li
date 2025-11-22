/**
 * @jest-environment node
 */
import { POST } from '../links/log-visit/route'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

// Mock dependencies
jest.mock('@/lib/db', () => ({
    db: {
        query: jest.fn(),
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
        (db.query as jest.Mock).mockResolvedValue({})

        const req = new NextRequest('http://localhost/api/links/log-visit', {
            method: 'POST',
            body: JSON.stringify({ linkId: 'link-123' }),
        })
        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE "Link"'),
            ['link-123']
        )
        expect(await res.json()).toEqual({ success: true })
    })
})
