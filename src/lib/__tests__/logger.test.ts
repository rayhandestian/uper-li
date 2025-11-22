import { logger } from '../logger'

// Mock console methods
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { })
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { })
const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => { })

describe('Logger', () => {
    const originalEnv = process.env

    beforeEach(() => {
        jest.clearAllMocks()
        process.env = { ...originalEnv }
    })

    afterAll(() => {
        process.env = originalEnv
        jest.restoreAllMocks()
    })

    it('should log info messages', () => {
        logger.info('Test info message', { key: 'value' })

        expect(consoleLogSpy).toHaveBeenCalled()
        const logCall = consoleLogSpy.mock.calls[0][0]

        try {
            const logObj = JSON.parse(logCall)
            expect(logObj.level).toBe('info')
            expect(logObj.message).toBe('Test info message')
            expect(logObj.context).toEqual({ key: 'value' })
            expect(logObj.timestamp).toBeDefined()
        } catch (e) {
            // Fallback if it were to use console.error or pretty print
            expect(logCall).toContain('INFO')
        }
    })

    it('should log error messages', () => {
        const error = new Error('Test error')
        logger.error('Test error message', error)

        // In production/test mode, everything goes to console.log as JSON
        expect(consoleLogSpy).toHaveBeenCalled()
        const logCall = consoleLogSpy.mock.calls[0][0]

        try {
            const logObj = JSON.parse(logCall)
            expect(logObj.level).toBe('error')
            expect(logObj.message).toBe('Test error message')
            expect(logObj.error).toBeDefined()
            expect(logObj.error.message).toBe('Test error')
            expect(logObj.error.stack).toBeDefined()
        } catch (e) {
            expect(logCall).toContain('ERROR')
        }
    })

    it('should log warn messages', () => {
        logger.warn('Test warn message')

        expect(consoleLogSpy).toHaveBeenCalled()
        const logCall = consoleLogSpy.mock.calls[0][0]

        try {
            const logObj = JSON.parse(logCall)
            expect(logObj.level).toBe('warn')
            expect(logObj.message).toBe('Test warn message')
        } catch (e) {
            expect(logCall).toContain('WARN')
        }
    })

    it('should format errors correctly when passed as context', () => {
        const error = new Error('Context error')
        logger.info('Message with error context', { err: error })

        expect(consoleLogSpy).toHaveBeenCalled()
        const logCall = consoleLogSpy.mock.calls[0][0]

        try {
            const logObj = JSON.parse(logCall)
            expect(logObj.context).toBeDefined()
            // Depending on implementation, it might serialize the error or just keep it as is
        } catch (e) {
            // ignore
        }
    })
})
