import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ShortUrlActions from '../../ShortUrlActions'
import { logger } from '@/lib/logger'

// Mock logger
jest.mock('@/lib/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}))

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn(),
    },
})

describe('ShortUrlActions', () => {
    const mockShortUrl = 'test-url'

    const mockFullUrl = `uper.li/${mockShortUrl}`

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders copy and visit buttons', () => {
        render(<ShortUrlActions shortUrl={mockShortUrl} />)

        expect(screen.getByTitle('Copy URL')).toBeInTheDocument()
        expect(screen.getByTitle('Visit URL')).toBeInTheDocument()
    })

    it('copies url to clipboard when copy button is clicked', async () => {
        render(<ShortUrlActions shortUrl={mockShortUrl} />)

        const copyButton = screen.getByTitle('Copy URL')
        fireEvent.click(copyButton)

        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockFullUrl)
        })

        // Should show checkmark icon temporarily (implementation detail, might be hard to test exact icon change without checking SVG paths or class names)
        // But we can check if state changed if it affects aria-label or title if we updated the component to support it
    })

    it('logs error if clipboard copy fails', async () => {
        const error = new Error('Clipboard error')
            ; (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(error)

        render(<ShortUrlActions shortUrl={mockShortUrl} />)

        const copyButton = screen.getByTitle('Copy URL')
        fireEvent.click(copyButton)

        await waitFor(() => {
            expect(logger.error).toHaveBeenCalledWith('Failed to copy: ', error)
        })
    })

    it('opens link in new tab when visit button is clicked', () => {
        const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)

        render(<ShortUrlActions shortUrl={mockShortUrl} />)

        const visitButton = screen.getByTitle('Visit URL')
        fireEvent.click(visitButton)

        expect(openSpy).toHaveBeenCalledWith(`https://${mockFullUrl}`, '_blank')
        openSpy.mockRestore()
    })
})
