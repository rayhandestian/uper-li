/**
 * @jest-environment node
 */
import { register } from '../instrumentation'

// Mock the validateEnvironment function
jest.mock('../lib/validateEnv', () => ({
    validateEnvironment: jest.fn(),
}))

// Import after mocking
import { validateEnvironment } from '../lib/validateEnv'

describe('Instrumentation', () => {
    const originalEnv = process.env
    const originalRuntime = process.env.NEXT_RUNTIME

    beforeEach(() => {
        jest.clearAllMocks()
        // Reset environment variables
        process.env = { ...originalEnv }
        process.env.NEXT_RUNTIME = originalRuntime
    })

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv
        process.env.NEXT_RUNTIME = originalRuntime
    })

    describe('register', () => {
        it('should call validateEnvironment when NEXT_RUNTIME is nodejs', async () => {
            process.env.NEXT_RUNTIME = 'nodejs'

            await register()

            expect(validateEnvironment).toHaveBeenCalledTimes(1)
        })

        it('should not call validateEnvironment when NEXT_RUNTIME is not nodejs', async () => {
            process.env.NEXT_RUNTIME = 'edge'

            await register()

            expect(validateEnvironment).not.toHaveBeenCalled()
        })

        it('should not call validateEnvironment when NEXT_RUNTIME is undefined', async () => {
            delete process.env.NEXT_RUNTIME

            await register()

            expect(validateEnvironment).not.toHaveBeenCalled()
        })

        it('should handle validation success in production', async () => {
            process.env.NEXT_RUNTIME = 'nodejs'
            Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })
            const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('process.exit called')
            })

            await register()

            expect(validateEnvironment).toHaveBeenCalledTimes(1)
            expect(mockExit).not.toHaveBeenCalled()

            mockExit.mockRestore()
        })

        it('should exit process on validation failure in production', async () => {
            process.env.NEXT_RUNTIME = 'nodejs'
            Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })

            const validationError = new Error('Validation failed')
            ;(validateEnvironment as jest.Mock).mockImplementation(() => {
                throw validationError
            })

            const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('process.exit called')
            })

            await expect(register()).rejects.toThrow('process.exit called')

            expect(validateEnvironment).toHaveBeenCalledTimes(1)
            expect(mockExit).toHaveBeenCalledWith(1)

            mockExit.mockRestore()
        })

        it('should log warning and continue on validation failure in development', async () => {
            process.env.NEXT_RUNTIME = 'nodejs'
            Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true })

            const validationError = new Error('Validation failed')
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

            ;(validateEnvironment as jest.Mock).mockImplementation(() => {
                throw validationError
            })

            await register()

            expect(validateEnvironment).toHaveBeenCalledTimes(1)
            expect(consoleErrorSpy).toHaveBeenCalledWith('FATAL: Environment validation failed', validationError)
            expect(consoleWarnSpy).toHaveBeenCalledWith('Continuing in development mode despite validation errors')

            consoleWarnSpy.mockRestore()
            consoleErrorSpy.mockRestore()
        })

        it('should handle validation success in development', async () => {
            process.env.NEXT_RUNTIME = 'nodejs'
            Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true })

            await register()

            expect(validateEnvironment).toHaveBeenCalledTimes(1)
        })
    })
})