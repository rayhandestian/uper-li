/**
 * @jest-environment node
 */
import { POST } from '../verify-link-password/route'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Mock dependencies
jest.mock('@/lib/db', () => ({
    db: {
        query: jest.fn(),
    },
}))

jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
}))

describe('/api/verify-link-password', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return 400 if shortUrl or password is missing', async () => {
        const req = new NextRequest('http://localhost/api/verify-link-password', {
            method: 'POST',
            body: JSON.stringify({}),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Short URL dan password diperlukan.' })
    })

    it('should return 404 if link not found', async () => {
        ; (db.query as jest.Mock).mockResolvedValue({ rows: [] })

        const req = new NextRequest('http://localhost/api/verify-link-password', {
            method: 'POST',
            body: JSON.stringify({ shortUrl: 'nonexistent', password: 'test123' }),
        })
        const res = await POST(req)

        expect(res.status).toBe(404)
        expect(await res.json()).toEqual({ error: 'Link tidak ditemukan.' })
    })

    it('should return 400 if link has no password', async () => {
        ; (db.query as jest.Mock).mockResolvedValue({
            rows: [{ shortUrl: 'test', password: null }]
        })

        const req = new NextRequest('http://localhost/api/verify-link-password', {
            method: 'POST',
            body: JSON.stringify({ shortUrl: 'test', password: 'test123' }),
        })
        const res = await POST(req)

        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Link ini tidak memerlukan password.' })
    })

    it('should return 401 if password is incorrect', async () => {
        ; (db.query as jest.Mock).mockResolvedValue({
            rows: [{ shortUrl: 'test', password: 'hashed_password' }]
        })
            ; (bcrypt.compare as jest.Mock).mockResolvedValue(false)

        const req = new NextRequest('http://localhost/api/verify-link-password', {
            method: 'POST',
            body: JSON.stringify({ shortUrl: 'test', password: 'wrong' }),
        })
        const res = await POST(req)

        expect(res.status).toBe(401)
        expect(await res.json()).toEqual({ error: 'Password salah.' })
    })

    it('should return success if password is correct', async () => {
        ; (db.query as jest.Mock).mockResolvedValue({
            rows: [{ shortUrl: 'test', password: 'hashed_password' }]
        })
            ; (bcrypt.compare as jest.Mock).mockResolvedValue(true)

        const req = new NextRequest('http://localhost/api/verify-link-password', {
            method: 'POST',
            body: JSON.stringify({ shortUrl: 'test', password: 'correct' }),
        })
        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({ success: true })
    })
})
