/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DashboardPage from '../page'
import { useSession } from 'next-auth/react'

// Mock next-auth
jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
}))

// Mock LinkItem component
jest.mock('@/components/LinkItem', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function MockLinkItem({ link, onEdit, onDelete, onToggleActive, onOpenQr }: any) {
        return (
            <div data-testid="link-item">
                <span>{link.longUrl}</span>
                <button onClick={() => onEdit(link)}>Edit</button>
                <button onClick={() => onDelete(link.id)}>Delete</button>
                <button onClick={() => onToggleActive(link.id, link.active)}>Toggle</button>
                <button onClick={() => onOpenQr(link)}>QR</button>
            </div>
        )
    }
})

// Mock QRCodeCanvas
jest.mock('qrcode.react', () => ({
    QRCodeCanvas: () => <canvas data-testid="qr-code" />,
}))

jest.mock('@/components/CountUp', () => {
    return function MockCountUp({ end }: { end: number }) {
        return <span>{end}</span>
    }
})

describe('DashboardPage', () => {
    const mockSession = {
        user: {
            nimOrUsername: 'testuser',
            email: 'test@example.com',
        },
    }

    const mockLinks = [
        {
            id: '1',
            shortUrl: 'short1',
            longUrl: 'http://example.com/1',
            custom: false,
            customChanges: 0,
            customChangedAt: null,
            mode: 'DIRECT',
            active: true,
            createdAt: '2023-01-01T00:00:00Z',
            visitCount: 10,
            hasPassword: false,
        },
    ]

    const mockPagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
    }

    const mockUserStats = {
        totalLinks: 10,
        monthlyLinks: 2,
        role: 'STUDENT',
        totalActiveLinks: 8,
    }

    const mockFetch = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
            ; (useSession as jest.Mock).mockReturnValue({ data: mockSession, status: 'authenticated' })
        global.fetch = mockFetch
        mockFetch.mockImplementation((url) => {
            if (url === '/api/user/stats') {
                return Promise.resolve({ ok: true, json: async () => mockUserStats })
            }
            if (url.startsWith('/api/links')) {
                return Promise.resolve({ ok: true, json: async () => ({ links: mockLinks, pagination: mockPagination }) })
            }
            return Promise.resolve({ ok: true, json: async () => ({}) })
        })
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('renders dashboard correctly', async () => {
        mockFetch.mockImplementation((url) => {
            if (url === '/api/user/stats') {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockUserStats,
                })
            }
            if (url.startsWith('/api/links')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ links: mockLinks, pagination: mockPagination }),
                })
            }
            return Promise.reject(new Error('Unknown URL'))
        })

        render(<DashboardPage />)

        await waitFor(() => {
            expect(screen.getByText('Dashboard')).toBeInTheDocument()
            expect(screen.getByText('testuser')).toBeInTheDocument()
            expect(screen.getByText('http://example.com/1')).toBeInTheDocument()
        })
    })

    it('handles create link', async () => {
        mockFetch.mockImplementation((url) => {
            if (url === '/api/user/stats') {
                return Promise.resolve({ ok: true, json: async () => mockUserStats })
            }
            if (url.startsWith('/api/links') && !url.includes('visitCount')) { // Main list
                return Promise.resolve({ ok: true, json: async () => ({ links: mockLinks, pagination: mockPagination }) })
            }
            if (url.startsWith('/api/links') && url.includes('visitCount')) { // Analytics
                return Promise.resolve({ ok: true, json: async () => ({ links: mockLinks }) })
            }
            if (url === '/api/links' && arguments[1]?.method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ message: 'Link created' }),
                })
            }
            return Promise.reject(new Error('Unknown URL'))
        })

        render(<DashboardPage />)

        // Open create form
        fireEvent.click(screen.getByText('Buat Link Baru'))

        // Fill form
        fireEvent.change(screen.getByLabelText('URL Asli'), { target: { value: 'http://new.com' } })

        // Submit
        fireEvent.click(screen.getByRole('button', { name: 'Buat Link' }))

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/links', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    longUrl: 'http://new.com',
                }),
            }))
        })

        expect(await screen.findByText('Link berhasil dibuat!')).toBeInTheDocument()
    })

    it('handles delete link', async () => {
        mockFetch.mockImplementation((url) => {
            if (url === '/api/user/stats') {
                return Promise.resolve({ ok: true, json: async () => mockUserStats })
            }
            if (url.startsWith('/api/links') && !url.includes('visitCount')) {
                return Promise.resolve({ ok: true, json: async () => ({ links: mockLinks, pagination: mockPagination }) })
            }
            if (url.startsWith('/api/links') && url.includes('visitCount')) {
                return Promise.resolve({ ok: true, json: async () => ({ links: mockLinks }) })
            }
            if (url.startsWith('/api/links/') && arguments[1]?.method === 'DELETE') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ message: 'Link deleted' }),
                })
            }
            return Promise.reject(new Error('Unknown URL'))
        })

        render(<DashboardPage />)

        await waitFor(() => expect(screen.getByText('http://example.com/1')).toBeInTheDocument())

        // Click delete on item
        fireEvent.click(screen.getByText('Delete'))

        // Confirm delete modal
        expect(screen.getByText('Konfirmasi Hapus')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Hapus' }))

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/links/1', expect.objectContaining({
                method: 'DELETE',
            }))
        })
    })
    it('renders stats correctly', async () => {
        mockFetch.mockImplementation((url) => {
            if (url === '/api/user/stats') {
                return Promise.resolve({ ok: true, json: async () => mockUserStats })
            }
            if (url.startsWith('/api/links')) {
                return Promise.resolve({ ok: true, json: async () => ({ links: mockLinks, pagination: mockPagination }) })
            }
            return Promise.reject(new Error('Unknown URL'))
        })

        render(<DashboardPage />)

        await waitFor(() => {
            // Check for stats values rendered by the mock
            expect(screen.getAllByText('10').length).toBeGreaterThan(0) // Total links
            expect(screen.getAllByText('2').length).toBeGreaterThan(0) // Monthly links
            expect(screen.getByText('8')).toBeInTheDocument() // Active links
        })
    })

    it('handles filtering', async () => {
        render(<DashboardPage />)
        await waitFor(() => expect(screen.getByText('http://example.com/1')).toBeInTheDocument())
        mockFetch.mockClear()

        const filterSelect = screen.getByLabelText('Status') as HTMLSelectElement
        fireEvent.change(filterSelect, { target: { value: 'active' } })
        expect(filterSelect.value).toBe('active')

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('active=true'))
        }, { timeout: 3000 })

        fireEvent.change(filterSelect, { target: { value: 'inactive' } })
        expect(filterSelect.value).toBe('inactive')

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('active=false'))
        }, { timeout: 3000 })
    })

    it('handles sorting', async () => {
        render(<DashboardPage />)
        await waitFor(() => expect(screen.getByText('http://example.com/1')).toBeInTheDocument())
        mockFetch.mockClear()

        const sortSelect = screen.getByLabelText('Urutkan')

        fireEvent.change(sortSelect, { target: { value: 'visitCount' } })
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('sort=visitCount'))
        })

        fireEvent.change(sortSelect, { target: { value: 'shortUrl' } })
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('sort=shortUrl'))
        })
    })

    it('handles pagination', async () => {
        const paginationMultiPage = { ...mockPagination, totalPages: 2, hasNext: true }

        mockFetch.mockImplementation((url) => {
            if (url === '/api/user/stats') return Promise.resolve({ ok: true, json: async () => mockUserStats })
            if (url.includes('page=2')) {
                return Promise.resolve({ ok: true, json: async () => ({ links: mockLinks, pagination: { ...paginationMultiPage, page: 2, hasPrev: true, hasNext: false } }) })
            }
            return Promise.resolve({ ok: true, json: async () => ({ links: mockLinks, pagination: paginationMultiPage }) })
        })

        render(<DashboardPage />)
        await waitFor(() => expect(screen.getByText('http://example.com/1')).toBeInTheDocument())
        mockFetch.mockClear()

        await waitFor(() => expect(screen.getAllByText('Selanjutnya').length).toBeGreaterThan(0))

        fireEvent.click(screen.getAllByText('Selanjutnya')[0])

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('page=2'))
        })
    })

    it('handles edit link flow', async () => {
        mockFetch.mockImplementation((url, options) => {
            if (url === '/api/user/stats') return Promise.resolve({ ok: true, json: async () => mockUserStats })
            if (url.startsWith('/api/links') && options?.method === 'PATCH') {
                return Promise.resolve({ ok: true, json: async () => ({ message: 'Updated' }) })
            }
            return Promise.resolve({ ok: true, json: async () => ({ links: mockLinks, pagination: mockPagination }) })
        })

        render(<DashboardPage />)
        await waitFor(() => expect(screen.getByText('Edit')).toBeInTheDocument())

        // Click Edit
        fireEvent.click(screen.getByText('Edit'))

        // Verify Modal Open
        expect(screen.getByText('Edit Link')).toBeInTheDocument()
        expect(screen.getByDisplayValue('short1')).toBeInTheDocument()

        // Change Short URL
        fireEvent.change(screen.getByLabelText('Short URL'), { target: { value: 'newshort' } })

        // Change Password
        fireEvent.change(screen.getByPlaceholderText('Masukkan password baru'), { target: { value: 'newpass' } })

        // Save
        fireEvent.click(screen.getByText('Simpan'))

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/links/1', expect.objectContaining({
                method: 'PATCH',
                body: expect.stringContaining('"shortUrl":"newshort"'),
            }))
            expect(mockFetch).toHaveBeenCalledWith('/api/links/1', expect.objectContaining({
                body: expect.stringContaining('"password":"newpass"'),
            }))
        }, { timeout: 3000 })
    })

    it('handles QR modal', async () => {
        render(<DashboardPage />)
        await waitFor(() => expect(screen.getByText('QR')).toBeInTheDocument())

        fireEvent.click(screen.getByText('QR'))

        expect(screen.getByTestId('qr-code')).toBeInTheDocument()
    })
})
