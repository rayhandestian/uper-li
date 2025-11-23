/**
 * @jest-environment node
 */
import { POST } from '../reset-password/route'
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
    hash: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}))

describe('Reset Password API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should reset password successfully', async () => {
        const validUser = {
            id: 'user-1',
            verificationTokenExpires: new Date(Date.now() + 10000) // Future
        }

            ; (db.query as jest.Mock)
                .mockResolvedValueOnce({ rows: [validUser] }) // Find user
                .mockResolvedValueOnce({ rowCount: 1 }); // Update password

        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password')

        const req = new NextRequest('http://localhost/api/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                nimOrUsername: 'testuser',
                code: '123456',
                newPassword: 'newpassword123',
                confirmPassword: 'newpassword123'
            })
        })

        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE "User"'),
            expect.arrayContaining(['hashed-new-password', 'user-1'])
        )
    })

    it('should validate missing fields', async () => {
        const req = new NextRequest('http://localhost/api/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                nimOrUsername: 'testuser',
                // Missing code
                newPassword: 'newpassword123',
                confirmPassword: 'newpassword123'
            })
        })

        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it('should validate password mismatch', async () => {
        const req = new NextRequest('http://localhost/api/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                nimOrUsername: 'testuser',
                code: '123456',
                newPassword: 'password123',
                confirmPassword: 'mismatch123'
            })
        })

        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it('should handle invalid code or user not found', async () => {
        (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

        const req = new NextRequest('http://localhost/api/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                nimOrUsername: 'testuser',
                code: 'invalid',
                newPassword: 'newpassword123',
                confirmPassword: 'newpassword123'
            })
        })

        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it('should handle expired code', async () => {
        const expiredUser = {
            id: 'user-1',
            verificationTokenExpires: new Date(Date.now() - 10000) // Past
        }

            ; (db.query as jest.Mock).mockResolvedValueOnce({ rows: [expiredUser] })

        const req = new NextRequest('http://localhost/api/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                nimOrUsername: 'testuser',
                code: '123456',
                newPassword: 'newpassword123',
                confirmPassword: 'newpassword123'
            })
        })

        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual(expect.objectContaining({ error: expect.stringContaining('kadaluarsa') }))
    })
})
