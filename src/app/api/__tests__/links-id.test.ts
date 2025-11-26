/**
 * @jest-environment node
 */
import { PATCH, DELETE } from '../links/[id]/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
    authOptions: {},
}))

jest.mock('@/lib/prisma', () => ({
    prisma: {
        link: {
            findFirst: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        user: {
            update: jest.fn(),
        },
        $transaction: jest.fn((callback) => callback(prisma)),
    },
}))

jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
}))

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
        createdAt: new Date(),
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
            ; (prisma.link.findFirst as jest.Mock).mockResolvedValue(null)

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'PATCH',
                body: JSON.stringify({ active: true }),
            })
            const res = await PATCH(req, { params: Promise.resolve({ id: 'link-123' }) })
            expect(res.status).toBe(404)
        })

        it('should update link active status', async () => {
            ; (prisma.link.findFirst as jest.Mock).mockResolvedValue(mockLink)
                ; (prisma.link.update as jest.Mock).mockResolvedValue({ ...mockLink, active: false })

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'PATCH',
                body: JSON.stringify({ active: false }),
            })
            const res = await PATCH(req, { params: Promise.resolve({ id: 'link-123' }) })

            expect(res.status).toBe(200)
            expect(prisma.link.update).toHaveBeenCalledWith({
                where: { id: 'link-123' },
                data: expect.objectContaining({ active: false })
            })
        })

        it('should update link password', async () => {
            ; (prisma.link.findFirst as jest.Mock).mockResolvedValue(mockLink)
                ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')
                ; (prisma.link.update as jest.Mock).mockResolvedValue(mockLink)

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'PATCH',
                body: JSON.stringify({ password: 'newpass123' }),
            })
            const res = await PATCH(req, { params: Promise.resolve({ id: 'link-123' }) })

            expect(res.status).toBe(200)
            expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 12)
        })

        it('should remove link password when empty string', async () => {
            ; (prisma.link.findFirst as jest.Mock).mockResolvedValue(mockLink)
                ; (prisma.link.update as jest.Mock).mockResolvedValue(mockLink)

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'PATCH',
                body: JSON.stringify({ password: '' }),
            })
            const res = await PATCH(req, { params: Promise.resolve({ id: 'link-123' }) })

            expect(res.status).toBe(200)
            expect(prisma.link.update).toHaveBeenCalledWith({
                where: { id: 'link-123' },
                data: expect.objectContaining({ password: null })
            })
        })

        it('should return 400 if password too short', async () => {
            ; (prisma.link.findFirst as jest.Mock).mockResolvedValue(mockLink)

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'PATCH',
                body: JSON.stringify({ password: '123' }),
            })
            const res = await PATCH(req, { params: Promise.resolve({ id: 'link-123' }) })

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Password minimal 4 karakter.' })
        })

        it('should validate custom URL', async () => {
            ; (prisma.link.findFirst as jest.Mock).mockResolvedValue(mockLink)

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'PATCH',
                body: JSON.stringify({ shortUrl: 'invalid url!' }),
            })
            const res = await PATCH(req, { params: Promise.resolve({ id: 'link-123' }) })

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Short URL kustom tidak valid.' })
        })

        it('should check for reserved paths', async () => {
            ; (prisma.link.findFirst as jest.Mock).mockResolvedValue(mockLink)

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'PATCH',
                body: JSON.stringify({ shortUrl: 'admin' }),
            })
            const res = await PATCH(req, { params: Promise.resolve({ id: 'link-123' }) })

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Short URL kustom tidak tersedia.' })
        })

        it('should return 400 if no updates provided', async () => {
            ; (prisma.link.findFirst as jest.Mock).mockResolvedValue(mockLink)

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
            ; (prisma.link.findFirst as jest.Mock).mockResolvedValue(null)

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'DELETE',
            })
            const res = await DELETE(req, { params: Promise.resolve({ id: 'link-123' }) })
            expect(res.status).toBe(404)
        })

        it('should delete link successfully', async () => {
            ; (prisma.link.findFirst as jest.Mock).mockResolvedValue(mockLink)
                ; (prisma.link.delete as jest.Mock).mockResolvedValue(mockLink)
                ; (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-123' })

            const req = new NextRequest('http://localhost/api/links/link-123', {
                method: 'DELETE',
            })
            const res = await DELETE(req, { params: Promise.resolve({ id: 'link-123' }) })

            expect(res.status).toBe(200)
            expect(prisma.link.delete).toHaveBeenCalledWith({
                where: { id: 'link-123' }
            })
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: expect.any(Object)
            })
            expect(await res.json()).toEqual({ message: 'Link berhasil dihapus.' })
        })
    })
})
