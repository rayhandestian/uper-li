/**
 * Prisma Mock Helper for Jest Tests
 * 
 * Provides a consistent mock structure for Prisma client across all test files.
 * Usage:
 * 
 * jest.mock('@/lib/prisma', () => ({
 *   prisma: createPrismaMock()
 * }))
 */

import { TEST_HASHED_PASSWORD } from '../test-constants'

export const createPrismaMock = () => ({
    user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn()
    },
    link: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn()
    },
    $transaction: jest.fn((callback) => {
        // For callback-based transactions, execute the callback with a mock client
        if (typeof callback === 'function') {
            return callback(createPrismaMock())
        }
        // For array-based transactions, just resolve
        return Promise.resolve(callback)
    }),
    $queryRawUnsafe: jest.fn()
})

export const mockPrismaUser = (overrides = {}) => ({
    id: '1',
    email: 'test@example.com',
    nimOrUsername: 'testuser',
    password: TEST_HASHED_PASSWORD,
    role: 'STUDENT',
    emailVerified: new Date(),
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorLoginCode: null,
    twoFactorSetupCode: null,
    verificationToken: null,
    verificationTokenExpires: null,
    monthlyLinksCreated: 0,
    totalLinks: 0,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
})

export const mockPrismaLink = (overrides = {}) => ({
    id: '1',
    shortUrl: 'abc123',
    longUrl: 'https://example.com',
    userId: '1',
    custom: false,
    password: null,
    active: true,
    visitCount: 0,
    lastVisited: null,
    mode: 'DIRECT',
    createdAt: new Date(),
    updatedAt: new Date(),
    deactivatedAt: null,
    customChanges: 0,
    customChangedAt: null,
    ...overrides
})
