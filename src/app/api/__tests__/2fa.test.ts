/**
 * @jest-environment node
*/
import { POST as setupPOST } from '../2fa/setup/route'
import { POST as verifyPOST } from '../2fa/verify/route'
import { POST as verifyLoginPOST } from '../2fa/verify-login/route'
import { POST as disablePOST } from '../2fa/disable/route'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import {
    createMockRequest,
    createMockSession,
    createMockUser,
    mockDbSuccess,
    mockDbEmpty,
    futureDate,
    pastDate,
} from '@/__tests__/test-utils'

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

jest.mock('@/lib/email', () => ({
    sendEmail: jest.fn(),
}))

jest.mock('@/lib/rateLimit', () => ({
    withRateLimit: <T extends (...args: unknown[]) => unknown>(handler: T) => handler,
}))

jest.mock('crypto', () => ({
    randomInt: jest.fn(() => 123456),
}))

import { getServerSession } from 'next-auth'

describe('2FA Endpoints', () => {
    const mockSession = createMockSession()
    const mockUser = createMockUser()

    beforeEach(() => {
        jest.clearAllMocks()
            ; (getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    describe('POST /api/2fa/setup', () => {
        it('should return 401 if not authenticated', async () => {
            ; (getServerSession as jest.Mock).mockResolvedValue(null)

            const res = await setupPOST()

            expect(res.status).toBe(401)
        })

        it('should return 404 if user not found', async () => {
            ; (db.query as jest.Mock).mockResolvedValue(mockDbEmpty())

            const res = await setupPOST()

            expect(res.status).toBe(404)
            expect(await res.json()).toEqual({ error: 'User tidak ditemukan.' })
        })

        it('should return 400 if 2FA already enabled', async () => {
            ; (db.query as jest.Mock).mockResolvedValue(
                mockDbSuccess([{ ...mockUser, twoFactorEnabled: true }])
            )

            const res = await setupPOST()

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: '2FA sudah diaktifkan.' })
        })

        it('should send verification code successfully', async () => {
            ; (db.query as jest.Mock)
                .mockResolvedValueOnce(mockDbSuccess([mockUser])) // GET user
                .mockResolvedValueOnce({}) // UPDATE user
                ; (sendEmail as jest.Mock).mockResolvedValue({ messageId: 'test-id' })

            const res = await setupPOST()

            expect(res.status).toBe(200)
            expect(sendEmail).toHaveBeenCalled()
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE "User"'),
                expect.arrayContaining(['123456'])
            )
            expect(await res.json()).toEqual({
                message: 'Kode verifikasi telah dikirim ke email Anda.',
            })
        })

        it('should return 500 if email sending fails', async () => {
            ; (db.query as jest.Mock)
                .mockResolvedValueOnce(mockDbSuccess([mockUser]))
                .mockResolvedValueOnce({})
                ; (sendEmail as jest.Mock).mockRejectedValue(new Error('Email error'))

            const res = await setupPOST()

            expect(res.status).toBe(500)
            expect(await res.json()).toEqual({
                error: 'Gagal mengirim email verifikasi.',
            })
        })
    })

    describe('POST /api/2fa/verify', () => {
        it('should return 401 if not authenticated', async () => {
            ; (getServerSession as jest.Mock).mockResolvedValue(null)

            const req = createMockRequest('http://localhost/api/2fa/verify', {
                method: 'POST',
                body: { code: '123456' },
            })
            const res = await verifyPOST(req)

            expect(res.status).toBe(401)
        })

        it('should return 400 if code missing', async () => {
            const req = createMockRequest('http://localhost/api/2fa/verify', {
                method: 'POST',
                body: {},
            })
            const res = await verifyPOST(req)

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Kode verifikasi diperlukan.' })
        })

        it('should return 404 if user not found', async () => {
            ; (db.query as jest.Mock).mockResolvedValue(mockDbEmpty())

            const req = createMockRequest('http://localhost/api/2fa/verify', {
                method: 'POST',
                body: { code: '123456' },
            })
            const res = await verifyPOST(req)

            expect(res.status).toBe(404)
        })

        it('should return 400 if 2FA already enabled', async () => {
            ; (db.query as jest.Mock).mockResolvedValue(
                mockDbSuccess([{ ...mockUser, twoFactorEnabled: true }])
            )

            const req = createMockRequest('http://localhost/api/2fa/verify', {
                method: 'POST',
                body: { code: '123456' },
            })
            const res = await verifyPOST(req)

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: '2FA sudah diaktifkan.' })
        })

        it('should return 400 if no verification code requested', async () => {
            ; (db.query as jest.Mock).mockResolvedValue(
                mockDbSuccess([{ ...mockUser, twoFactorSecret: null }])
            )

            const req = createMockRequest('http://localhost/api/2fa/verify', {
                method: 'POST',
                body: { code: '123456' },
            })
            const res = await verifyPOST(req)

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Kode verifikasi belum diminta.' })
        })

        it('should return 400 if code expired', async () => {
            ; (db.query as jest.Mock).mockResolvedValue(
                mockDbSuccess([
                    {
                        ...mockUser,
                        twoFactorSecret: '123456',
                        verificationTokenExpires: pastDate(),
                    },
                ])
            )

            const req = createMockRequest('http://localhost/api/2fa/verify', {
                method: 'POST',
                body: { code: '123456' },
            })
            const res = await verifyPOST(req)

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Kode verifikasi telah kadaluarsa.' })
        })

        it('should return 400 if code incorrect', async () => {
            ; (db.query as jest.Mock).mockResolvedValue(
                mockDbSuccess([
                    {
                        ...mockUser,
                        twoFactorSecret: '654321',
                        verificationTokenExpires: futureDate(),
                    },
                ])
            )

            const req = createMockRequest('http://localhost/api/2fa/verify', {
                method: 'POST',
                body: { code: '123456' },
            })
            const res = await verifyPOST(req)

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'Kode verifikasi salah.' })
        })

        it('should enable 2FA successfully', async () => {
            ; (db.query as jest.Mock)
                .mockResolvedValueOnce(
                    mockDbSuccess([
                        {
                            ...mockUser,
                            twoFactorSecret: '123456',
                            verificationTokenExpires: futureDate(),
                        },
                    ])
                )
                .mockResolvedValueOnce({}) // UPDATE

            const req = createMockRequest('http://localhost/api/2fa/verify', {
                method: 'POST',
                body: { code: '123456' },
            })
            const res = await verifyPOST(req)

            expect(res.status).toBe(200)
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('twoFactorEnabled'),
                [mockSession.user.id]
            )
            expect(await res.json()).toEqual({ message: '2FA berhasil diaktifkan.' })
        })
    })

    describe('POST /api/2fa/verify-login', () => {
        it('should return 401 if not authenticated', async () => {
            ; (getServerSession as jest.Mock).mockResolvedValue(null)

            const req = createMockRequest('http://localhost/api/2fa/verify-login', {
                method: 'POST',
                body: { code: '123456' },
            })
            const res = await verifyLoginPOST(req)

            expect(res.status).toBe(401)
        })

        it('should return 400 if 2FA not enabled', async () => {
            ; (db.query as jest.Mock).mockResolvedValue(
                mockDbSuccess([{ ...mockUser, twoFactorEnabled: false }])
            )

            const req = createMockRequest('http://localhost/api/2fa/verify-login', {
                method: 'POST',
                body: { code: '123456' },
            })
            const res = await verifyLoginPOST(req)

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: '2FA tidak diaktifkan.' })
        })

        it('should verify login successfully', async () => {
            ; (db.query as jest.Mock)
                .mockResolvedValueOnce(
                    mockDbSuccess([
                        {
                            ...mockUser,
                            twoFactorEnabled: true,
                            twoFactorSecret: '123456',
                            verificationTokenExpires: futureDate(),
                        },
                    ])
                )
                .mockResolvedValueOnce({})

            const req = createMockRequest('http://localhost/api/2fa/verify-login', {
                method: 'POST',
                body: { code: '123456' },
            })
            const res = await verifyLoginPOST(req)

            expect(res.status).toBe(200)
            expect(await res.json()).toEqual({ message: 'Verifikasi 2FA berhasil.' })
        })
    })

    describe('POST /api/2fa/disable', () => {
        it('should return 401 if not authenticated', async () => {
            ; (getServerSession as jest.Mock).mockResolvedValue(null)

            const req = createMockRequest('http://localhost/api/2fa/disable', {
                method: 'POST',
            })
            const res = await disablePOST(req)

            expect(res.status).toBe(401)
        })

        it('should return 404 if user not found', async () => {
            ; (db.query as jest.Mock).mockResolvedValue(mockDbEmpty())

            const req = createMockRequest('http://localhost/api/2fa/disable', {
                method: 'POST',
            })
            const res = await disablePOST(req)

            expect(res.status).toBe(404)
        })

        it('should return 400 if 2FA not enabled', async () => {
            ; (db.query as jest.Mock).mockResolvedValue(
                mockDbSuccess([{ ...mockUser, twoFactorEnabled: false }])
            )

            const req = createMockRequest('http://localhost/api/2fa/disable', {
                method: 'POST',
            })
            const res = await disablePOST(req)

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: '2FA belum diaktifkan.' })
        })

        it('should disable 2FA successfully', async () => {
            ; (db.query as jest.Mock)
                .mockResolvedValueOnce(
                    mockDbSuccess([{ ...mockUser, twoFactorEnabled: true }])
                )
                .mockResolvedValueOnce({})

            const req = createMockRequest('http://localhost/api/2fa/disable', {
                method: 'POST',
            })
            const res = await disablePOST(req)

            expect(res.status).toBe(200)
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('twoFactorEnabled'),
                [mockSession.user.id]
            )
            expect(await res.json()).toEqual({ message: '2FA berhasil dinonaktifkan.' })
        })
    })
})
