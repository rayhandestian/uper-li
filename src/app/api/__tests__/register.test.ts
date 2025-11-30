/**
 * @jest-environment node
 */
import { POST } from '../register/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendEmail } from '@/lib/email'
import { TEST_HASHED_PASSWORD, TEST_PASSWORD, TEST_TOKEN } from '@/__tests__/test-constants'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
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
        password: TEST_PASSWORD,
        agreedToTerms: true,
        turnstileToken: TEST_TOKEN,
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
        ; (prisma.user.findUnique as jest.Mock)
            .mockResolvedValueOnce(null) // Email check
            .mockResolvedValueOnce(null) // Username check
            ; (bcrypt.hash as jest.Mock).mockResolvedValue(TEST_HASHED_PASSWORD)
            ; (prisma.user.create as jest.Mock).mockResolvedValue({ id: '1' })

        const req = new NextRequest('http://localhost/api/register', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        await POST(req)

        // Check if email was used in findUnique call
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { email: '12345678@student.universitaspertamina.ac.id' },
            select: { id: true, emailVerified: true, createdAt: true }
        })
    })

    it('should construct LECTURER email correctly', async () => {
        ; (prisma.user.findUnique as jest.Mock)
            .mockResolvedValueOnce(null) // Email check
            .mockResolvedValueOnce(null) // Username check
            ; (bcrypt.hash as jest.Mock).mockResolvedValue(TEST_HASHED_PASSWORD)
            ; (prisma.user.create as jest.Mock).mockResolvedValue({ id: '1' })

        const req = new NextRequest('http://localhost/api/register', {
            method: 'POST',
            body: JSON.stringify({ ...validBody, role: 'LECTURER' }),
        })
        await POST(req)

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { email: '12345678@universitaspertamina.ac.id' },
            select: { id: true, emailVerified: true, createdAt: true }
        })
    })

    it('should return 400 with generic error if email already exists', async () => {
        ; (prisma.user.findUnique as jest.Mock)
            .mockResolvedValueOnce({ id: 'existing-user', emailVerified: true, createdAt: new Date() }) // Email check - verified user
            .mockResolvedValueOnce(null) // Username check

        const req = new NextRequest('http://localhost/api/register', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Registrasi gagal. Silakan periksa data Anda.' })
    })

    it('should return 400 with generic error if nimOrUsername already exists', async () => {
        ; (prisma.user.findUnique as jest.Mock)
            .mockResolvedValueOnce(null) // Email check passes
            .mockResolvedValueOnce({ id: 'existing-user', emailVerified: true, createdAt: new Date() }) // Username check fails

        const req = new NextRequest('http://localhost/api/register', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Registrasi gagal. Silakan periksa data Anda.' })
    })

    it('should register user successfully', async () => {
        ; (prisma.user.findUnique as jest.Mock)
            .mockResolvedValueOnce(null) // Email check
            .mockResolvedValueOnce(null) // Username check
            ; (bcrypt.hash as jest.Mock).mockResolvedValue(TEST_HASHED_PASSWORD)
            ; (prisma.user.create as jest.Mock).mockResolvedValue({ id: '1' })
            ; (sendEmail as jest.Mock).mockResolvedValue({ messageId: 'test-id' })

        const req = new NextRequest('http://localhost/api/register', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        const res = await POST(req)

        expect(res.status).toBe(200)
        expect(bcrypt.hash).toHaveBeenCalledWith(TEST_PASSWORD, 12)
        expect(sendEmail).toHaveBeenCalled()

        const response = await res.json()
        expect(response.message).toContain('Registrasi berhasil')
    })

    it('should generate 6-character alphanumeric verification code', async () => {
        ; (prisma.user.findUnique as jest.Mock)
            .mockResolvedValueOnce(null) // Email
            .mockResolvedValueOnce(null) // Username
            ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')
            ; (prisma.user.create as jest.Mock).mockResolvedValue({ id: '1' })
            ; (sendEmail as jest.Mock).mockResolvedValue({ messageId: 'test-id' })

        const req = new NextRequest('http://localhost/api/register', {
            method: 'POST',
            body: JSON.stringify(validBody),
        })
        await POST(req)

        // Check that create was called with verification code (6 alphanumeric characters)
        const createCall = (prisma.user.create as jest.Mock).mock.calls[0]
        expect(createCall).toBeDefined()
        const verificationCode = createCall[0].data.verificationToken
        expect(verificationCode).toMatch(/^[a-z0-9]{6}$/)
    })
})
