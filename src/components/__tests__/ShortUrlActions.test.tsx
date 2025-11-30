/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ShortUrlActions from '../ShortUrlActions'
import { logger } from '@/lib/logger'

// Mock logger
jest.mock('@/lib/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}))

// Mock clipboard API
const mockClipboard = {
    writeText: jest.fn(),
}

// Mock window.open
const mockWindowOpen = jest.fn()

describe('ShortUrlActions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        Object.assign(navigator, {
            clipboard: mockClipboard,
        })
        window.open = mockWindowOpen
    })

    it('should display short URL', () => {
        render(<ShortUrlActions shortUrl="abc123" />)

        expect(screen.getByText('uper.li/abc123')).toBeInTheDocument()
    })

    it('should copy URL to clipboard', async () => {
        mockClipboard.writeText.mockResolvedValue(undefined)

        render(<ShortUrlActions shortUrl="test-link" />)

        const copyButton = screen.getByTitle('Copy URL')
        fireEvent.click(copyButton)

        expect(mockClipboard.writeText).toHaveBeenCalledWith('uper.li/test-link')
    })

    it('should show copied state temporarily', async () => {
        mockClipboard.writeText.mockResolvedValue(undefined)

        render(<ShortUrlActions shortUrl="test-link" />)

        const copyButton = screen.getByTitle('Copy URL')
        fireEvent.click(copyButton)

        // Check icon changed (checkmark appears)
        await waitFor(() => {
            const svg = copyButton.querySelector('svg')
            expect(svg).toHaveClass('text-green-600')
        })

        // Wait for state to reset (2 seconds)
        await waitFor(
            () => {
                const svg = copyButton.querySelector('svg')
                expect(svg).not.toHaveClass('text-green-600')
            },
            { timeout: 2500 }
        )
    })

    it('should open URL in new tab', () => {
        render(<ShortUrlActions shortUrl="visit-me" />)

        const visitButton = screen.getByTitle('Visit URL')
        fireEvent.click(visitButton)

        expect(mockWindowOpen).toHaveBeenCalledWith('https://uper.li/visit-me', '_blank')
    })

    it('should handle clipboard API errors', async () => {
        const error = new Error('Clipboard error')
        mockClipboard.writeText.mockRejectedValue(error)

        render(<ShortUrlActions shortUrl="test-link" />)

        const copyButton = screen.getByTitle('Copy URL')
        fireEvent.click(copyButton)

        await waitFor(() => {
            expect(logger.error).toHaveBeenCalledWith('Failed to copy: ', error)
        })
    })

    it('should stop event propagation on copy', () => {
        const mockStopPropagation = jest.fn()
        mockClipboard.writeText.mockResolvedValue(undefined)

        render(<ShortUrlActions shortUrl="test" />)

        const copyButton = screen.getByTitle('Copy URL')

        // Create a mock event with stopPropagation
        const clickEvent = new MouseEvent('click', { bubbles: true })
        Object.defineProperty(clickEvent, 'stopPropagation', {
            value: mockStopPropagation,
        })

        fireEvent(copyButton, clickEvent)

        expect(mockStopPropagation).toHaveBeenCalled()
    })

    it('should stop event propagation on visit', () => {
        const mockStopPropagation = jest.fn()

        render(<ShortUrlActions shortUrl="test" />)

        const visitButton = screen.getByTitle('Visit URL')

        // Create a mock event with stopPropagation
        const clickEvent = new MouseEvent('click', { bubbles: true })
        Object.defineProperty(clickEvent, 'stopPropagation', {
            value: mockStopPropagation,
        })

        fireEvent(visitButton, clickEvent)

        expect(mockStopPropagation).toHaveBeenCalled()
    })
})
