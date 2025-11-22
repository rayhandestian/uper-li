/**
 * @jest-environment node
 */
import { PATCH, DELETE } from '../links/[id]/route'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Mock dependencies
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
    authOptions: {},
}))

jest.mock('@/lib/db', () => ({
    db: {
        query: jest.fn(),
    },
}))

jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
}))

import { getServerSession } from 'next-auth'

describe('/api/links/[id]', () => {
    const mockSession = {
        user: {
            id: 'user-123',
        },
    }

    const mockLink = {
        id: 'link-123',
        userId: 'user-123',
        shortUrl: 'abc123',
        longUrl: 'http://example.com',
        customChanges: 0,
    }

    beforeEach(() => {
        jest.clearAllMocks()
            ; (getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    describe('PATCH', () => {
        it('should return 401 if not authenticated', async () => {
            ; (getServerSession as jest.Mock).mockResolvedValue(null)

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'PATCH',
                body: JSON.stringify({ active: true }),
            })
            const res = await PATCH(req, { params: Promise.resolve({ id: 'link-123' }) })
            expect(res.status).toBe(401)
        })

        it('should return 404 if link not found', async () => {
            ; (db.query as jest.Mock).mockResolvedValue({ rows: [] })

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'PATCH',
                body: JSON.stringify({ active: true }),
            })
            const res = await PATCH(req, { params: Promise.resolve({ id: 'link-123' }) })
            expect(res.status).toBe(404)
        })

        it('should update link active status', async () => {
            ; (db.query as jest.Mock)
                .mockResolvedValueOnce({ rows: [mockLink] }) // GET
                .mockResolvedValueOnce({ rows: [{ ...mockLink, active: false }] }) // UPDATE

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'PATCH',
                body: JSON.stringify({ active: false }),
            })
            const res = await PATCH(req, { params: Promise.resolve({ id: 'link-123' }) })

            expect(res.status).toBe(200)
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE "Link"'),
                expect.any(Array)
            )
        })

        it('should update link password', async () => {
            ; (db.query as jest.Mock)
                .mockResolvedValueOnce({ rows: [mockLink] })
                .mockResolvedValueOnce({ rows: [mockLink] })
                ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'PATCH',
                body: JSON.stringify({ password: 'newpass123' }),
            })
            const res = await PATCH(req, { params: Promise.resolve({ id: 'link-123' }) })

            expect(res.status).toBe(200)
            expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 12)
        })

        it('should remove link password when empty string', async () => {
            ; (db.query as jest.Mock)
                .mockResolvedValueOnce({ rows: [mockLink] })
                .mockResolvedValueOnce({ rows: [mockLink] })

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'PATCH',
                body: JSON.stringify({ password: '' }),
            })
            const res = await PATCH(req, { params: Promise.resolve({ id: 'link-123' }) })

            expect(res.status).toBe(200)
        })

        it('should return 400 if password too short', async () => {
            ; (db.query as jest.Mock).mockResolvedValue({ rows: [mockLink] })

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'PATCH',
                body: JSON.stringify({ password: '123' }),
            })
            const res = await PATCH(req, { params: Promise.resolve({ id: 'link-123' }) })

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Password minimal 4 karakter.' })
        })

        it('should validate custom URL', async () => {
            ; (db.query as jest.Mock).mockResolvedValue({ rows: [mockLink] })

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'PATCH',
                body: JSON.stringify({ shortUrl: 'invalid url!' }),
            })
            const res = await PATCH(req, { params: Promise.resolve({ id: 'link-123' }) })

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Short URL kustom tidak valid.' })
        })

        it('should check for reserved paths', async () => {
            ; (db.query as jest.Mock).mockResolvedValue({ rows: [mockLink] })

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'PATCH',
                body: JSON.stringify({ shortUrl: 'admin' }),
            })
            const res = await PATCH(req, { params: Promise.resolve({ id: 'link-123' }) })

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Short URL kustom tidak tersedia.' })
        })

        it('should return 400 if no updates provided', async () => {
            ; (db.query as jest.Mock).mockResolvedValue({ rows: [mockLink] })

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'PATCH',
                body: JSON.stringify({}),
            })
            const res = await PATCH(req, { params: Promise.resolve({ id: 'link-123' }) })

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Tidak ada data untuk diperbarui.' })
        })
    })

    describe('DELETE', () => {
        it('should return 401 if not authenticated', async () => {
            ; (getServerSession as jest.Mock).mockResolvedValue(null)

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'DELETE',
            })
            const res = await DELETE(req, { params: Promise.resolve({ id: 'link-123' }) })
            expect(res.status).toBe(401)
        })

        it('should return 404 if link not found', async () => {
            ; (db.query as jest.Mock).mockResolvedValue({ rows: [] })

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'DELETE',
            })
            const res = await DELETE(req, { params: Promise.resolve({ id: 'link-123' }) })
            expect(res.status).toBe(404)
        })

        it('should delete link successfully', async () => {
            ; (db.query as jest.Mock)
                .mockResolvedValueOnce({ rows: [mockLink] }) // GET
                .mockResolvedValueOnce({ rows: [] }) // DELETE

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'DELETE',
            })
            const res = await DELETE(req, { params: Promise.resolve({ id: 'link-123' }) })

            expect(res.status).toBe(200)
            expect(db.query).toHaveBeenCalledWith(
                'DELETE FROM "Link" WHERE id = $1',
                ['link-123']
            )
            expect(await res.json()).toEqual({ message: 'Link berhasil dihapus.' })
        })
    })
})
