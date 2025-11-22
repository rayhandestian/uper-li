import { checkUrlSafety } from '../safeBrowsing'
import { google } from 'googleapis'

// Mock googleapis
jest.mock('googleapis', () => {
    const findMock = jest.fn()
    return {
        google: {
            safebrowsing: jest.fn().mockReturnValue({
                threatMatches: {
                    find: findMock,
                },
            }),
        },
    }
})

describe('checkUrlSafety', () => {
    const mockFind = google.safebrowsing('v4').threatMatches.find as jest.Mock

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return true if no threats are found', async () => {
        mockFind.mockResolvedValue({
            data: {
                matches: [],
            },
        })

        const isSafe = await checkUrlSafety('https://example.com')
        expect(isSafe).toBe(true)
    })

    it('should return false if threats are found', async () => {
        mockFind.mockResolvedValue({
            data: {
                matches: [{ threatType: 'MALWARE' }],
            },
        })

        const isSafe = await checkUrlSafety('http://malware.com')
        expect(isSafe).toBe(false)
    })

    it('should return true (fail-safe) if API throws error', async () => {
        mockFind.mockRejectedValue(new Error('API Error'))

        const isSafe = await checkUrlSafety('https://example.com')
        expect(isSafe).toBe(true)
    })
})
