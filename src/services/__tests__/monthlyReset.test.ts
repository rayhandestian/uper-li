/**
 * @jest-environment node
 */
import { LinkService } from '../linkService'
import { prisma } from '@/lib/prisma'
import { checkUrlSafety } from '@/lib/safeBrowsing'
import { createMockUser, createMockLink, createMockPrismaTransaction } from '@/__tests__/test-utils'
import { getCurrentMonthString } from '@/lib/dateUtils'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        $transaction: jest.fn(),
    },
}))
jest.mock('@/lib/safeBrowsing')
jest.mock('@/lib/dateUtils')

describe('LinkService - Lazy Monthly Reset', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should reset monthlyLinksCreated if month has changed', async () => {
        // Mock current month as Feb 2026
        ; (getCurrentMonthString as jest.Mock).mockReturnValue('2026-02')

        // Mock user with a different month (Jan 2026) and some count
        const mockUser = {
            ...createMockUser({
                id: 'user-123',
                monthlyLinksCreated: 5,
            }),
            currentMonth: '2026-01'
        }

        const mockLink = createMockLink({
            userId: mockUser.id,
        })

            ; (checkUrlSafety as jest.Mock).mockResolvedValue(true)

        let userUpdatedWithReset = false
        const mockUpdate = jest.fn().mockImplementation((args) => {
            if (args.data.monthlyLinksCreated === 0 && args.data.currentMonth === '2026-02') {
                userUpdatedWithReset = true
                return { ...mockUser, monthlyLinksCreated: 0, currentMonth: '2026-02' }
            }
            return mockUser
        })

            ; (prisma.$transaction as jest.Mock).mockImplementation(createMockPrismaTransaction({
                user: {
                    findUnique: jest.fn().mockResolvedValue(mockUser),
                    update: mockUpdate,
                },
                link: {
                    findUnique: jest.fn().mockResolvedValue(null),
                    create: jest.fn().mockResolvedValue(mockLink),
                },
            }))

        await LinkService.createLink(mockUser.id, {
            longUrl: 'https://example.com',
        })

        // Should have updated user to reset count before incrementing
        expect(userUpdatedWithReset).toBe(true)
        // first update is reset, second is increment (implied in transaction logic of service)
        expect(mockUpdate).toHaveBeenCalledTimes(2)
        expect(mockUpdate).toHaveBeenNthCalledWith(1, expect.objectContaining({
            data: expect.objectContaining({
                monthlyLinksCreated: 0,
                currentMonth: '2026-02'
            })
        }))
    })

    it('should NOT reset monthlyLinksCreated if month is the same', async () => {
        ; (getCurrentMonthString as jest.Mock).mockReturnValue('2026-02')

        const mockUser = {
            ...createMockUser({
                id: 'user-123',
                monthlyLinksCreated: 2,
            }),
            currentMonth: '2026-02'
        }

        const mockLink = createMockLink({
            userId: mockUser.id,
        })

            ; (checkUrlSafety as jest.Mock).mockResolvedValue(true)

        const mockUpdate = jest.fn().mockResolvedValue(mockUser)

            ; (prisma.$transaction as jest.Mock).mockImplementation(createMockPrismaTransaction({
                user: {
                    findUnique: jest.fn().mockResolvedValue(mockUser),
                    update: mockUpdate,
                },
                link: {
                    findUnique: jest.fn().mockResolvedValue(null),
                    create: jest.fn().mockResolvedValue(mockLink),
                },
            }))

        await LinkService.createLink(mockUser.id, {
            longUrl: 'https://example.com',
        })

        // Should only have called update once (the increment)
        expect(mockUpdate).toHaveBeenCalledTimes(1)
        expect(mockUpdate).not.toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                monthlyLinksCreated: 0
            })
        }))
    })
})
