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
})
