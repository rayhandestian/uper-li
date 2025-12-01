/**
 * @jest-environment node
 */
import { PATCH as linkPATCH, DELETE as linkDELETE } from '../admin/links/[id]/route'
import { prisma } from '@/lib/prisma'
import {
    createMockRequest,
    createMockParams,
    setupMockAdminAuth,
    setupMockUnauthenticated,
    expectJsonResponse,
} from '@/__tests__/test-utils'

// Mock dependencies
jest.mock('next/headers', () => ({
    cookies: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
    prisma: {
        link: {
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}))

jest.mock('@/lib/admin-auth', () => ({
    validateAdminSession: jest.fn(),
    extendSessionActivity: jest.fn(),
}))

jest.mock('@/lib/admin-audit', () => ({
    logAdminAction: jest.fn(),
    AUDIT_ACTIONS: {
        LINK_VIEW: 'LINK_VIEW', // Using LINK_VIEW as per route implementation
        LINK_DELETE: 'LINK_DELETE',
    },
}))

import { cookies } from 'next/headers'
import { validateAdminSession } from '@/lib/admin-auth'

describe('Admin Links API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('PATCH /api/admin/links/[id]', () => {
        it('should return 401 if unauthorized', async () => {
            setupMockUnauthenticated(cookies as jest.Mock, validateAdminSession as jest.Mock)
            const req = createMockRequest('http://localhost/api/admin/links/link-1', {
                method: 'PATCH',
                body: { active: false },
            })
            const res = await linkPATCH(req, { params: createMockParams({ id: 'link-1' }) })
            await expectJsonResponse(res, 401, { error: 'Unauthorized' })
        })

        it('should return 400 if active field missing', async () => {
            setupMockAdminAuth(cookies as jest.Mock, validateAdminSession as jest.Mock)
            const req = createMockRequest('http://localhost/api/admin/links/link-1', {
                method: 'PATCH',
                body: {}, // Missing active
            })
            const res = await linkPATCH(req, { params: createMockParams({ id: 'link-1' }) })
            await expectJsonResponse(res, 400, { error: 'Active field is required' })
        })

        it('should update link status', async () => {
            setupMockAdminAuth(cookies as jest.Mock, validateAdminSession as jest.Mock)
                ; (prisma.link.update as jest.Mock).mockResolvedValue({
                    id: 'link-1',
                    shortUrl: 'abc',
                    active: false,
                    User: { nimOrUsername: 'user1', email: 'user1@example.com' }
                })

            const req = createMockRequest('http://localhost/api/admin/links/link-1', {
                method: 'PATCH',
                body: { active: false },
            })
            const res = await linkPATCH(req, { params: createMockParams({ id: 'link-1' }) })

            expect(res.status).toBe(200)
            const data = await res.json()
            expect(data.active).toBe(false)
            expect(prisma.link.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'link-1' },
                data: expect.objectContaining({ active: false })
            }))
        })
    })

    describe('DELETE /api/admin/links/[id]', () => {
        it('should return 401 if unauthorized', async () => {
            setupMockUnauthenticated(cookies as jest.Mock, validateAdminSession as jest.Mock)
            const req = createMockRequest('http://localhost/api/admin/links/link-1', { method: 'DELETE' })
            const res = await linkDELETE(req, { params: createMockParams({ id: 'link-1' }) })
            await expectJsonResponse(res, 401, { error: 'Unauthorized' })
        })

        it('should delete link', async () => {
            setupMockAdminAuth(cookies as jest.Mock, validateAdminSession as jest.Mock)
                ; (prisma.link.delete as jest.Mock).mockResolvedValue({ id: 'link-1' })

            const req = createMockRequest('http://localhost/api/admin/links/link-1', { method: 'DELETE' })
            const res = await linkDELETE(req, { params: createMockParams({ id: 'link-1' }) })

            await expectJsonResponse(res, 200, { message: 'Link berhasil dihapus.' })
            expect(prisma.link.delete).toHaveBeenCalledWith({ where: { id: 'link-1' } })
        })
    })
})
