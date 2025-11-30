/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, act } from '@testing-library/react'
import TimeZoneDisplay from '../TimeZoneDisplay'

// Mock useState to control the tooltip state
const mockUseState = jest.fn()
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useState: (initial: boolean) => [initial, mockUseState],
}))

describe('TimeZoneDisplay', () => {
    const mockProps = {
        timestamp: '2023-12-25T10:30:00Z',
        timeZone: 'Asia/Jakarta',
    }

    beforeEach(() => {
        jest.clearAllMocks()
        // Reset useState mock
        mockUseState.mockClear()
    })

    it('renders "Belum pernah" when timestamp is null', () => {
        render(<TimeZoneDisplay timestamp={null} timeZone="Asia/Jakarta" />)

        expect(screen.getByText('Belum pernah')).toBeInTheDocument()
    })

    it('renders formatted date and time with icon by default', () => {
        render(<TimeZoneDisplay {...mockProps} />)

        // Should show the formatted date/time
        expect(screen.getByText(/Desember 2023 17:30/)).toBeInTheDocument()

        // Should show the clock icon
        const svg = document.querySelector('svg')
        expect(svg).toBeInTheDocument()
        expect(svg).toHaveAttribute('stroke', 'currentColor')
    })

    it('renders without icon when showIcon is false', () => {
        render(<TimeZoneDisplay {...mockProps} showIcon={false} />)

        // Should show the formatted date/time
        expect(screen.getByText(/Desember 2023 17:30/)).toBeInTheDocument()

        // Should not show the clock icon
        const svg = document.querySelector('svg')
        expect(svg).not.toBeInTheDocument()
    })

    it('applies custom className', () => {
        const { container } = render(<TimeZoneDisplay {...mockProps} className="custom-class" />)

        const element = container.firstChild as HTMLElement
        expect(element).toHaveClass('custom-class')
    })

    it('shows tooltip on click and hides after timeout', () => {
        jest.useFakeTimers()

        render(<TimeZoneDisplay {...mockProps} />)

        const timeElement = screen.getByText(/Desember 2023 17:30/)

        // Initially tooltip should not be visible (opacity-0)
        const tooltip = document.querySelector('.opacity-100')
        expect(tooltip).not.toBeInTheDocument()

        // Click to show tooltip
        fireEvent.click(timeElement)

        // Should call setShowTooltip(true)
        expect(mockUseState).toHaveBeenCalledWith(true)

        // Fast-forward 3 seconds
        act(() => {
            jest.advanceTimersByTime(3000)
        })

        // Should call setShowTooltip(false)
        expect(mockUseState).toHaveBeenCalledWith(false)

        jest.useRealTimers()
    })

    it('displays tooltip text correctly', () => {
        render(<TimeZoneDisplay {...mockProps} />)

        expect(screen.getByText('Kunjungan terbaru')).toBeInTheDocument()
    })

    it('handles different timezones correctly', () => {
        render(<TimeZoneDisplay timestamp="2023-12-25T10:30:00Z" timeZone="UTC" />)

        // UTC time should show 10:30
        expect(screen.getByText(/Desember 2023 10:30/)).toBeInTheDocument()
    })

    it('formats date correctly in Indonesian locale', () => {
        render(<TimeZoneDisplay timestamp="2023-01-15T14:45:00Z" timeZone="Asia/Jakarta" />)

        // Should show January 15, 2023 at 21:45 (Jakarta time)
        expect(screen.getByText(/Januari 2023 21:45/)).toBeInTheDocument()
    })
})