/**
 * @jest-environment node
 */
import { GET } from '../user/stats/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// Mock dependencies
jest.mock('next-auth')
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
        },
    },
}))
jest.mock('@/lib/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}))

describe('GET /api/user/stats', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return 401 if not authenticated', async () => {
        ; (getServerSession as jest.Mock).mockResolvedValue(null)

        const response = await GET()

        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('should return 404 if user not found', async () => {
        ; (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: 'user-123' },
        })
            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

        const response = await GET()

        expect(response.status).toBe(404)
        const data = await response.json()
        expect(data).toEqual({ error: 'User not found' })
    })

    it('should return user stats if authenticated and user exists', async () => {
        ; (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: 'user-123' },
        })

        const mockUser = {
            totalLinks: 10,
            monthlyLinksCreated: 5,
            role: 'USER',
            _count: {
                Link: 8,
            },
        }
            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

        const response = await GET()

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data).toEqual({
            totalLinks: 10,
            monthlyLinks: 5,
            role: 'USER',
            totalActiveLinks: 8,
        })
    })

    it('should return 500 on internal server error', async () => {
        ; (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: 'user-123' },
        })
            ; (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'))

        const response = await GET()

        expect(response.status).toBe(500)
        const data = await response.json()
        expect(data).toEqual({ error: 'Internal Server Error' })
    })
})
