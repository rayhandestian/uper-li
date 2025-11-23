/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import LinkItem from '../LinkItem'

// Mock child components
jest.mock('../ShortUrlActions', () => {
    return function MockShortUrlActions({ shortUrl }: { shortUrl: string }) {
        return <div data-testid="short-url-actions">{shortUrl}</div>
    }
})

jest.mock('../TimeZoneDisplay', () => {
    return function MockTimeZoneDisplay({ timestamp }: { timestamp: string }) {
        return <div data-testid="timezone-display">{timestamp}</div>
    }
})

describe('LinkItem', () => {
    const mockLink = {
        id: 'link-1',
        shortUrl: 'abc',
        longUrl: 'http://example.com',
        custom: false,
        customChanges: 0,
        customChangedAt: null,
        mode: 'DIRECT' as const,
        active: true,
        createdAt: '2023-01-01T00:00:00Z',
        visitCount: 10,
        hasPassword: false,
        lastVisited: new Date('2023-01-02T00:00:00Z')
    }

    const mockProps = {
        link: mockLink,
        timeZone: 'Asia/Jakarta',
        onEdit: jest.fn(),
        onDelete: jest.fn(),
        onToggleActive: jest.fn(),
        onOpenQr: jest.fn()
    }

    it('renders link information correctly', () => {
        render(<LinkItem {...mockProps} />)

        expect(screen.getByText('http://example.com')).toBeInTheDocument()
        expect(screen.getByTestId('short-url-actions')).toHaveTextContent('abc')
        expect(screen.getByText('10')).toBeInTheDocument() // Visit count
    })

    it('toggles expansion on click', () => {
        render(<LinkItem {...mockProps} />)

        // Initially details should be hidden (or at least not visible/accessible easily if using CSS visibility)
        // The component uses grid-rows for animation, but content is in DOM.
        // Let's check if the expand button rotates or aria-label changes

        const expandButton = screen.getByLabelText('Expand details')
        fireEvent.click(expandButton)

        expect(screen.getByLabelText('Collapse details')).toBeInTheDocument()
    })

    it('calls action handlers', () => {
        render(<LinkItem {...mockProps} />)

        // Expand first to see buttons
        fireEvent.click(screen.getByLabelText('Expand details'))

        // Click Edit
        fireEvent.click(screen.getByText('Edit'))
        expect(mockProps.onEdit).toHaveBeenCalledWith(mockLink)

        // Click QR Code
        fireEvent.click(screen.getByText('QR Code'))
        expect(mockProps.onOpenQr).toHaveBeenCalledWith(mockLink)

        // Click Delete
        fireEvent.click(screen.getByText('Hapus'))
        expect(mockProps.onDelete).toHaveBeenCalledWith(mockLink.id)

        // Click Toggle Active
        fireEvent.click(screen.getByText('Nonaktifkan'))
        expect(mockProps.onToggleActive).toHaveBeenCalledWith(mockLink.id, true)
    })
})
