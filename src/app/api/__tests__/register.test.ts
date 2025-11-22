/**
 * @jest-environment node
 */
import { POST } from '../register/route'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { sendEmail } from '@/lib/email'

// Mock dependencies
jest.mock('@/lib/db', () => ({
    db: {
        query: jest.fn(),
    },
}))

jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
}))

jest.mock('@/lib/email', () => ({
    sendEmail: jest.fn(),
}))

// Mock rate limit wrapper
jest.mock('@/lib/rateLimit', () => ({
    withRateLimit: <T extends (...args: unknown[]) => unknown>(handler: T) => handler,
}))

// Mock fetch for Turnstile
global.fetch = jest.fn()

describe('/api/register', () => {
    const validBody = {
        role: 'STUDENT',
        nimOrUsername: '12345678',
        password: 'password123',
        agreedToTerms: true,
        turnstileToken: 'valid-token',
    }

    beforeEach(() => {
        jest.clearAllMocks()
            // Mock successful Turnstile verification by default
            ; (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ success: true }),
            })
    })

    it('should return 400 if terms not accepted', async () => {
        const req = new NextRequest('http://localhost/api/register', {
            method: 'POST',
            body: JSON.stringify({ ...validBody, agreedToTerms: false }),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Anda harus menyetujui Syarat dan Ketentuan.' })
    })

    it('should return 400 if Turnstile verification fails', async () => {
        ; (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => ({ success: false }),
        })

        const req = new NextRequest('http://localhost/api/register', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Verifikasi CAPTCHA gagal.' })
    })

    it('should construct STUDENT email correctly', async () => {
        ; (db.query as jest.Mock).mockResolvedValue({ rows: [] })
            ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')

        const req = new NextRequest('http://localhost/api/register', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        await POST(req)

        // Check if email was constructed correctly
        expect(db.query).toHaveBeenCalledWith(
            expect.any(String),
            ['12345678@student.universitaspertamina.ac.id']
        )
    })

    it('should construct LECTURER email correctly', async () => {
        ; (db.query as jest.Mock).mockResolvedValue({ rows: [] })
            ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')

        const req = new NextRequest('http://localhost/api/register', {
            method: 'POST',
            body: JSON.stringify({ ...validBody, role: 'LECTURER' }),
        })
        await POST(req)

        expect(db.query).toHaveBeenCalledWith(
            expect.any(String),
            ['12345678@universitaspertamina.ac.id']
        )
    })

    it('should return 400 if email already exists', async () => {
        ; (db.query as jest.Mock)
            .mockResolvedValueOnce({ rows: [{ id: 'existing-user' }] }) // Email check

        const req = new NextRequest('http://localhost/api/register', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Email sudah terdaftar.' })
    })

    it('should return 400 if nimOrUsername already exists', async () => {
        ; (db.query as jest.Mock)
            .mockResolvedValueOnce({ rows: [] }) // Email check passes
            .mockResolvedValueOnce({ rows: [{ id: 'existing-user' }] }) // Username check fails

        const req = new NextRequest('http://localhost/api/register', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'NIM/Username sudah digunakan.' })
    })

    it('should register user successfully', async () => {
        ; (db.query as jest.Mock)
            .mockResolvedValueOnce({ rows: [] }) // Email check
            .mockResolvedValueOnce({ rows: [] }) // Username check
            .mockResolvedValueOnce({ rows: [] }) // Insert user
            ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')
            ; (sendEmail as jest.Mock).mockResolvedValue({ messageId: 'test-id' })

        const req = new NextRequest('http://localhost/api/register', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12)
        expect(sendEmail).toHaveBeenCalled()

        const response = await res.json()
        expect(response.message).toContain('Registrasi berhasil')
    })

    it('should generate 6-digit verification code', async () => {
        ; (db.query as jest.Mock)
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')
            ; (sendEmail as jest.Mock).mockResolvedValue({ messageId: 'test-id' })

        const req = new NextRequest('http://localhost/api/register', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        await POST(req)

        // Check that INSERT query includes verification code (6 digits)
        const insertCall = (db.query as jest.Mock).mock.calls.find(
            call => call[0].includes('INSERT INTO "User"')
        )
        expect(insertCall).toBeDefined()
        const verificationCode = insertCall[1][4] // 5th parameter
        expect(verificationCode).toMatch(/^\d{6}$/)
    })
})
