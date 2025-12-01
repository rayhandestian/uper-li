import { prisma } from '../prisma'



describe('Prisma Client', () => {
    it('exports prisma instance', () => {
        expect(prisma).toBeDefined()
    })

    it('reuses instance in development', () => {
        const originalEnv = process.env.NODE_ENV

        Object.defineProperty(process.env, 'NODE_ENV', {
            value: 'development',
            writable: true,
        })

        // Re-require to trigger logic
        jest.resetModules()
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { prisma: prisma1 } = require('../prisma')
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { prisma: prisma2 } = require('../prisma')

        expect(prisma1).toBe(prisma2)

        Object.defineProperty(process.env, 'NODE_ENV', {
            value: originalEnv,
            writable: true,
        })
    })
})
