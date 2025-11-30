/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import AnalyticsContent from '../AnalyticsContent'

// Mock child components
jest.mock('../ShortUrlActions', () => {
    return function MockShortUrlActions({ shortUrl }: { shortUrl: string }) {
        return <div data-testid="short-url-actions">{shortUrl}</div>
    }
})

jest.mock('../TimeZoneDisplay', () => {
    return function MockTimeZoneDisplay({ timestamp, timeZone }: { timestamp: string | null; timeZone: string }) {
        return <div data-testid="timezone-display" data-timestamp={timestamp} data-timezone={timeZone}>
            {timestamp ? 'Last visited' : 'Belum pernah'}
        </div>
    }
})

describe('AnalyticsContent', () => {
    const mockLinks = [
        {
            id: 'link-1',
            shortUrl: 'abc123',
            longUrl: 'https://example.com',
            visitCount: 10,
            lastVisited: new Date('2023-12-25T10:30:00Z')
        },
        {
            id: 'link-2',
            shortUrl: 'def456',
            longUrl: 'https://test.com',
            visitCount: 5,
            lastVisited: null
        }
    ]

    const defaultProps = {
        links: mockLinks,
        totalVisits: 15
    }

    it('renders the analytics header correctly', () => {
        render(<AnalyticsContent {...defaultProps} />)

        expect(screen.getByText('Analitik Link')).toBeInTheDocument()
        expect(screen.getByText('Lihat statistik kunjungan link Anda')).toBeInTheDocument()
    })

    it('displays total visits and active links statistics', () => {
        render(<AnalyticsContent {...defaultProps} />)

        expect(screen.getByText('Total Kunjungan')).toBeInTheDocument()
        expect(screen.getByText('15')).toBeInTheDocument()

        expect(screen.getByText('Link Aktif')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('renders timezone selector with default value', () => {
        render(<AnalyticsContent {...defaultProps} />)

        const select = screen.getByDisplayValue('WIB (Jakarta)')
        expect(select).toBeInTheDocument()
        expect(select).toHaveValue('Asia/Jakarta')
    })

    it('allows changing timezone', () => {
        render(<AnalyticsContent {...defaultProps} />)

        const select = screen.getByDisplayValue('WIB (Jakarta)')
        fireEvent.change(select, { target: { value: 'UTC' } })

        expect(select).toHaveValue('UTC')
    })

    it('renders all timezone options', () => {
        render(<AnalyticsContent {...defaultProps} />)

        expect(screen.getByText('WIB (Jakarta)')).toBeInTheDocument()
        expect(screen.getByText('WITA (Makassar)')).toBeInTheDocument()
        expect(screen.getByText('WIT (Jayapura)')).toBeInTheDocument()
        expect(screen.getByText('UTC')).toBeInTheDocument()
    })

    it('renders link list with correct data', () => {
        render(<AnalyticsContent {...defaultProps} />)

        expect(screen.getByText('Link Terpopuler')).toBeInTheDocument()

        // Check first link
        const shortUrlActions = screen.getAllByTestId('short-url-actions')
        expect(shortUrlActions[0]).toHaveTextContent('abc123')
        expect(screen.getByText('https://example.com')).toBeInTheDocument()
        expect(screen.getByText('10 kunjungan')).toBeInTheDocument()

        // Check second link
        expect(shortUrlActions[1]).toHaveTextContent('def456')
        expect(screen.getByText('https://test.com')).toBeInTheDocument()
        expect(screen.getByText('5 kunjungan')).toBeInTheDocument()
    })

    it('passes correct timezone to TimeZoneDisplay components', () => {
        render(<AnalyticsContent {...defaultProps} />)

        const timezoneDisplays = screen.getAllByTestId('timezone-display')

        // First link has lastVisited date
        expect(timezoneDisplays[0]).toHaveAttribute('data-timestamp', '2023-12-25T10:30:00.000Z')
        expect(timezoneDisplays[0]).toHaveAttribute('data-timezone', 'Asia/Jakarta')

        // Second link has null timestamp (attribute should not exist)
        expect(timezoneDisplays[1]).not.toHaveAttribute('data-timestamp')
        expect(timezoneDisplays[1]).toHaveAttribute('data-timezone', 'Asia/Jakarta')
    })

    it('renders empty state when no links exist', () => {
        render(<AnalyticsContent links={[]} totalVisits={0} />)

        expect(screen.getByText('Belum ada link yang dibuat.')).toBeInTheDocument()

        // Check that both statistics show 0
        const zeros = screen.getAllByText('0')
        expect(zeros).toHaveLength(2) // Total visits and active links both show 0
    })

    it('displays correct visit counts for each link', () => {
        render(<AnalyticsContent {...defaultProps} />)

        expect(screen.getByText('10 kunjungan')).toBeInTheDocument()
        expect(screen.getByText('5 kunjungan')).toBeInTheDocument()
    })

    it('updates timezone for all TimeZoneDisplay components when changed', () => {
        render(<AnalyticsContent {...defaultProps} />)

        const select = screen.getByDisplayValue('WIB (Jakarta)')
        fireEvent.change(select, { target: { value: 'UTC' } })

        const timezoneDisplays = screen.getAllByTestId('timezone-display')
        timezoneDisplays.forEach(display => {
            expect(display).toHaveAttribute('data-timezone', 'UTC')
        })
    })
})