import { addConstantDelay, performDummyHash } from '../timing'

describe('timing utilities', () => {
    describe('addConstantDelay', () => {
        it('should delay within the specified range', async () => {
            const start = Date.now()
            await addConstantDelay(50, 100)
            const elapsed = Date.now() - start

            expect(elapsed).toBeGreaterThanOrEqual(50)
            expect(elapsed).toBeLessThan(150) // Add buffer for test execution
        })

        it('should use default range when no parameters provided', async () => {
            const start = Date.now()
            await addConstantDelay()
            const elapsed = Date.now() - start

            expect(elapsed).toBeGreaterThanOrEqual(100)
            expect(elapsed).toBeLessThan(250) // Add buffer
        })
    })

    describe('performDummyHash', () => {
        it('should complete without error', async () => {
            await expect(performDummyHash()).resolves.not.toThrow()
        })

        it('should take reasonable time (bcrypt operation)', async () => {
            const start = Date.now()
            await performDummyHash()
            const elapsed = Date.now() - start

            // bcrypt with cost 12 should take at least 50ms
            expect(elapsed).toBeGreaterThan(50)
        })
    })
})
