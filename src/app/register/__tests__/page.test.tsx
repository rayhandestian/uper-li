/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegisterPage from '../page'
import { useRouter } from 'next/navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}))

// Mock Turnstile
jest.mock('@marsidev/react-turnstile', () => ({
    Turnstile: ({ onSuccess }: { onSuccess: (token: string) => void }) => (
        <button data-testid="turnstile-mock" onClick={() => onSuccess('mock-token')}>
            Verify Turnstile
        </button>
    ),
}))

// Mock Footer
jest.mock('@/components/Footer', () => {
    return function MockFooter() {
        return <div data-testid="footer">Footer</div>
    }
})

describe('RegisterPage', () => {
    const mockPush = jest.fn()
    const mockFetch = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
            ; (useRouter as jest.Mock).mockReturnValue({ push: mockPush })
        global.fetch = mockFetch
    })

    it('renders registration form correctly', () => {
        render(<RegisterPage />)

        expect(screen.getByText('Daftar UPer.li')).toBeInTheDocument()
        expect(screen.getByLabelText('Mahasiswa')).toBeChecked()
        expect(screen.getByLabelText('NIM')).toBeInTheDocument()
        expect(screen.getByLabelText('Password')).toBeInTheDocument()
        expect(screen.getByLabelText('Konfirmasi Password')).toBeInTheDocument()
    })

    it('switches role correctly', () => {
        render(<RegisterPage />)

        const staffRadio = screen.getByLabelText('Dosen/Staff')
        fireEvent.click(staffRadio)

        expect(staffRadio).toBeChecked()
        expect(screen.getByLabelText('Username')).toBeInTheDocument()
    })

    it('validates password mismatch', async () => {
        render(<RegisterPage />)

        // Fill form
        fireEvent.change(screen.getByLabelText('NIM'), { target: { value: '123456789' } })
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
        fireEvent.change(screen.getByLabelText('Konfirmasi Password'), { target: { value: 'password456' } })

        // Agree to terms
        fireEvent.click(screen.getByLabelText(/Saya setuju dengan/i))

        // Verify Turnstile
        fireEvent.click(screen.getByTestId('turnstile-mock'))

        // Submit
        fireEvent.click(screen.getByRole('button', { name: 'Daftar' }))

        expect(await screen.findByText('Password dan konfirmasi password tidak cocok.')).toBeInTheDocument()
    })

    it('handles successful registration', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        })

        render(<RegisterPage />)

        // Fill form
        fireEvent.change(screen.getByLabelText('NIM'), { target: { value: '123456789' } })
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
        fireEvent.change(screen.getByLabelText('Konfirmasi Password'), { target: { value: 'password123' } })

        // Agree to terms
        fireEvent.click(screen.getByLabelText(/Saya setuju dengan/i))

        // Verify Turnstile
        fireEvent.click(screen.getByTestId('turnstile-mock'))

        // Submit
        fireEvent.click(screen.getByRole('button', { name: 'Daftar' }))

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/register', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    role: 'STUDENT',
                    nimOrUsername: '123456789',
                    password: 'password123',
                    agreedToTerms: true,
                    turnstileToken: 'mock-token',
                }),
            }))
        })

        expect(localStorage.getItem('verify_nimOrUsername')).toBe('123456789')
        expect(mockPush).toHaveBeenCalledWith('/verify')
    })

    it('handles registration error', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Registration failed' }),
        })

        render(<RegisterPage />)

        // Fill form
        fireEvent.change(screen.getByLabelText('NIM'), { target: { value: '123456789' } })
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
        fireEvent.change(screen.getByLabelText('Konfirmasi Password'), { target: { value: 'password123' } })

        // Agree to terms
        fireEvent.click(screen.getByLabelText(/Saya setuju dengan/i))

        // Verify Turnstile
        fireEvent.click(screen.getByTestId('turnstile-mock'))

        // Submit
        fireEvent.click(screen.getByRole('button', { name: 'Daftar' }))

        expect(await screen.findByText('Registration failed')).toBeInTheDocument()
    })
})
