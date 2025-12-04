/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AccountPage from '../page'
import { useSession } from 'next-auth/react'

// Mock next-auth
jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
}))

// Mock ChangePasswordForm
jest.mock('../ChangePasswordForm', () => {
    return function MockChangePasswordForm() {
        return <div data-testid="change-password-form">Change Password Form</div>
    }
})

describe('AccountPage', () => {
    const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        role: 'STUDENT',
        nimOrUsername: '123456789',
        emailVerified: true,
        monthlyLinksCreated: 2,
        totalLinks: 10,
        twoFactorEnabled: false,
    }

    const mockFetch = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
            ; (useSession as jest.Mock).mockReturnValue({ data: {}, status: 'authenticated' })
        global.fetch = mockFetch
    })

    it('renders user profile correctly', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockUser,
        })

        render(<AccountPage />)

        await waitFor(() => {
            expect(screen.getByText('test@example.com')).toBeInTheDocument()
            expect(screen.getByText('Mahasiswa')).toBeInTheDocument()
            expect(screen.getByText('123456789')).toBeInTheDocument()
            expect(screen.getByText('Terverifikasi')).toBeInTheDocument()
        })
    })

    it('handles 2FA setup flow', async () => {
        mockFetch
            .mockResolvedValueOnce({ // Initial profile fetch
                ok: true,
                json: async () => mockUser,
            })
            .mockResolvedValueOnce({ // Setup 2FA
                ok: true,
                json: async () => ({ message: 'Code sent' }),
            })
            .mockResolvedValueOnce({ // Verify 2FA
                ok: true,
                json: async () => ({ message: '2FA enabled' }),
            })
            .mockResolvedValueOnce({ // Refresh profile
                ok: true,
                json: async () => ({ ...mockUser, twoFactorEnabled: true }),
            })

        render(<AccountPage />)

        await waitFor(() => expect(screen.getByText('Aktifkan 2FA')).toBeInTheDocument())

        // Click Enable 2FA
        fireEvent.click(screen.getByText('Aktifkan 2FA'))

        await waitFor(() => expect(screen.getByPlaceholderText('ABC123')).toBeInTheDocument())

        // Enter code
        fireEvent.change(screen.getByPlaceholderText('ABC123'), { target: { value: '123456' } })

        // Verify
        fireEvent.click(screen.getByText('Verifikasi'))

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/2fa/verify', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ code: '123456' }),
            }))
        })
    })

    it('handles 2FA disable flow', async () => {
        const userWith2FA = { ...mockUser, twoFactorEnabled: true }
        mockFetch
            .mockResolvedValueOnce({ // Initial profile fetch
                ok: true,
                json: async () => userWith2FA,
            })
            .mockResolvedValueOnce({ // Disable 2FA
                ok: true,
                json: async () => ({ message: '2FA disabled' }),
            })
            .mockResolvedValueOnce({ // Refresh profile
                ok: true,
                json: async () => mockUser,
            })

        render(<AccountPage />)

        await waitFor(() => expect(screen.getByText('Nonaktifkan 2FA')).toBeInTheDocument())

        // Click Disable 2FA
        fireEvent.click(screen.getByText('Nonaktifkan 2FA'))

        // Confirm modal
        expect(screen.getByText('Konfirmasi Nonaktifkan 2FA')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Ya, Nonaktifkan' }))

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/2fa/disable', expect.objectContaining({
                method: 'POST',
            }))
        })
    })
    it('shows loading state initially', () => {
        // We don't resolve the fetch promise immediately to keep it loading
        mockFetch.mockImplementation(() => new Promise(() => { }))
        render(<AccountPage />)
        expect(screen.getByText('Memuat...')).toBeInTheDocument()
    })

    it('shows user not found state when fetch fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Failed'))
        render(<AccountPage />)
        await waitFor(() => expect(screen.getByText('User tidak ditemukan.')).toBeInTheDocument())
    })

    it('handles 2FA enable error', async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: async () => mockUser }) // Profile
            .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Setup failed' }) }) // Setup

        render(<AccountPage />)
        await waitFor(() => expect(screen.getByText('Aktifkan 2FA')).toBeInTheDocument())

        fireEvent.click(screen.getByText('Aktifkan 2FA'))

        await waitFor(() => expect(screen.getByText('Setup failed')).toBeInTheDocument())
    })

    it('handles 2FA verify error', async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: async () => mockUser }) // Profile
            .mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Code sent' }) }) // Setup
            .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Invalid code' }) }) // Verify

        render(<AccountPage />)
        await waitFor(() => expect(screen.getByText('Aktifkan 2FA')).toBeInTheDocument())

        // Enable first to get to verify screen
        fireEvent.click(screen.getByText('Aktifkan 2FA'))
        await waitFor(() => expect(screen.getByPlaceholderText('ABC123')).toBeInTheDocument())

        // Enter code
        fireEvent.change(screen.getByPlaceholderText('ABC123'), { target: { value: '123456' } })
        fireEvent.click(screen.getByText('Verifikasi'))

        await waitFor(() => expect(screen.getByText('Invalid code')).toBeInTheDocument())
    })

    it('handles 2FA disable error', async () => {
        const userWith2FA = { ...mockUser, twoFactorEnabled: true }
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: async () => userWith2FA }) // Profile
            .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Disable failed' }) }) // Disable

        render(<AccountPage />)
        await waitFor(() => expect(screen.getByText('Nonaktifkan 2FA')).toBeInTheDocument())

        fireEvent.click(screen.getByText('Nonaktifkan 2FA'))
        expect(screen.getByText('Konfirmasi Nonaktifkan 2FA')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Ya, Nonaktifkan' }))

        await waitFor(() => expect(screen.getByText('Disable failed')).toBeInTheDocument())
    })
})
