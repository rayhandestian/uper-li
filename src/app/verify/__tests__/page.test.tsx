/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VerifyPage from '../page'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
    signIn: jest.fn(),
}))

// Mock Footer
jest.mock('@/components/Footer', () => {
    return function MockFooter() {
        return <div data-testid="footer">Footer</div>
    }
})

describe('VerifyPage', () => {
    const mockPush = jest.fn()
    const mockFetch = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
            ; (useRouter as jest.Mock).mockReturnValue({ push: mockPush })
        global.fetch = mockFetch
        localStorage.clear()
    })

    it('redirects to register if no username in localStorage', () => {
        render(<VerifyPage />)
        expect(mockPush).toHaveBeenCalledWith('/register')
    })

    it('renders verification form correctly', () => {
        localStorage.setItem('verify_nimOrUsername', 'testuser')
        render(<VerifyPage />)

        expect(screen.getByText('Verifikasi Email')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('ABC123')).toBeInTheDocument()
    })

    it('handles successful verification and auto-login', async () => {
        localStorage.setItem('verify_nimOrUsername', 'testuser')
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ sessionToken: 'token123' }),
        })
            ; (signIn as jest.Mock).mockResolvedValueOnce({ ok: true })

        render(<VerifyPage />)

        // Enter code
        fireEvent.change(screen.getByPlaceholderText('ABC123'), { target: { value: '123456' } })

        // Submit
        fireEvent.click(screen.getByRole('button', { name: 'Verifikasi' }))

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/verify-code', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ code: '123456' }),
            }))
        })

        expect(signIn).toHaveBeenCalledWith('credentials', {
            nimOrUsername: 'testuser',
            sessionToken: 'token123',
            redirect: false,
        })

        expect(mockPush).toHaveBeenCalledWith('/dashboard')
        expect(localStorage.getItem('verify_nimOrUsername')).toBeNull()
    })

    it('handles verification error', async () => {
        localStorage.setItem('verify_nimOrUsername', 'testuser')
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Invalid code' }),
        })

        render(<VerifyPage />)

        // Enter code
        fireEvent.change(screen.getByPlaceholderText('ABC123'), { target: { value: '123456' } })

        // Submit
        fireEvent.click(screen.getByRole('button', { name: 'Verifikasi' }))

        expect(await screen.findByText('Invalid code')).toBeInTheDocument()
    })
    it('handles session expiry during submission', async () => {
        localStorage.setItem('verify_nimOrUsername', 'testuser')
        render(<VerifyPage />)

        // Clear session
        localStorage.removeItem('verify_nimOrUsername')

        // Enter code
        fireEvent.change(screen.getByPlaceholderText('ABC123'), { target: { value: '123456' } })

        // Submit
        fireEvent.click(screen.getByRole('button', { name: 'Verifikasi' }))

        expect(await screen.findByText('Sesi verifikasi telah berakhir. Silakan daftar ulang.')).toBeInTheDocument()
    })

    it('handles auto-login failure', async () => {
        localStorage.setItem('verify_nimOrUsername', 'testuser')
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ sessionToken: 'token123' }),
        })
            ; (signIn as jest.Mock).mockResolvedValueOnce({ ok: false })

        render(<VerifyPage />)

        fireEvent.change(screen.getByPlaceholderText('ABC123'), { target: { value: '123456' } })
        fireEvent.click(screen.getByRole('button', { name: 'Verifikasi' }))

        expect(await screen.findByText('Verifikasi berhasil, tetapi gagal masuk. Silakan coba masuk manual.')).toBeInTheDocument()
    })

    it('handles missing session token (redirect to login)', async () => {
        localStorage.setItem('verify_nimOrUsername', 'testuser')
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({}), // No session token
        })

        render(<VerifyPage />)

        fireEvent.change(screen.getByPlaceholderText('ABC123'), { target: { value: '123456' } })
        fireEvent.click(screen.getByRole('button', { name: 'Verifikasi' }))

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/login?verified=true')
        })
        expect(localStorage.getItem('verify_nimOrUsername')).toBeNull()
    })
})
