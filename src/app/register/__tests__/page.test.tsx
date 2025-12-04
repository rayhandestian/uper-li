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
    it('validates terms agreement', async () => {
        render(<RegisterPage />)

        // Fill form
        fireEvent.change(screen.getByLabelText('NIM'), { target: { value: '123456789' } })
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
        fireEvent.change(screen.getByLabelText('Konfirmasi Password'), { target: { value: 'password123' } })

        // Verify Turnstile
        fireEvent.click(screen.getByTestId('turnstile-mock'))

        // Submit without checking terms
        fireEvent.click(screen.getByRole('button', { name: 'Daftar' }))

        expect(await screen.findByText('Anda harus menyetujui Syarat dan Ketentuan serta Kebijakan Privasi.')).toBeInTheDocument()
    })



    it('validates password length', async () => {
        render(<RegisterPage />)

        // Fill form
        fireEvent.change(screen.getByLabelText('NIM'), { target: { value: '123456789' } })
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: '12345' } }) // Too short
        fireEvent.change(screen.getByLabelText('Konfirmasi Password'), { target: { value: '12345' } })

        // Agree to terms
        fireEvent.click(screen.getByLabelText(/Saya setuju dengan/i))

        // Verify Turnstile
        fireEvent.click(screen.getByTestId('turnstile-mock'))

        // Submit
        fireEvent.click(screen.getByRole('button', { name: 'Daftar' }))

        expect(await screen.findByText('Password minimal 6 karakter.')).toBeInTheDocument()
    })

    it('handles email already registered and resend verification', async () => {
        mockFetch.mockImplementation((url) => {
            if (url === '/api/register') {
                return Promise.resolve({
                    ok: false,
                    json: async () => ({ error: 'Email sudah terdaftar.' }),
                })
            }
            if (url === '/api/resend-verification') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({}),
                })
            }
            return Promise.reject(new Error('Unknown URL'))
        })

        render(<RegisterPage />)

        // Fill form
        fireEvent.change(screen.getByLabelText('NIM'), { target: { value: '123456789' } })
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
        fireEvent.change(screen.getByLabelText('Konfirmasi Password'), { target: { value: 'password123' } })
        fireEvent.click(screen.getByLabelText(/Saya setuju dengan/i))
        fireEvent.click(screen.getByTestId('turnstile-mock'))

        // Submit
        fireEvent.click(screen.getByRole('button', { name: 'Daftar' }))

        // Verify error message
        expect(await screen.findByText(/Email sudah terdaftar/)).toBeInTheDocument()

        // Verify Resend button appears
        const resendButton = screen.getByText('Kirim Ulang')
        expect(resendButton).toBeInTheDocument()

        // Click Resend
        fireEvent.click(resendButton)

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/resend-verification', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ nimOrUsername: '123456789' }),
            }))
        })

        expect(localStorage.getItem('verify_nimOrUsername')).toBe('123456789')
        expect(mockPush).toHaveBeenCalledWith('/verify')
    })

    it('shows email preview and validates input', () => {
        render(<RegisterPage />)

        const input = screen.getByLabelText('NIM')

        // Valid NIM
        fireEvent.change(input, { target: { value: '123456789' } })
        expect(screen.getByText('123456789@student.universitaspertamina.ac.id')).toBeInTheDocument()
        expect(screen.queryByText(/Hanya huruf, angka/)).not.toBeInTheDocument()

        // Invalid NIM
        fireEvent.change(input, { target: { value: 'invalid@nim' } })
        expect(screen.getByText(/Hanya huruf, angka/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Daftar' })).toBeDisabled()

        // Switch to Staff
        fireEvent.click(screen.getByLabelText('Dosen/Staff'))
        const usernameInput = screen.getByLabelText('Username')

        // Valid Username
        fireEvent.change(usernameInput, { target: { value: 'john.doe' } })
        expect(screen.getByText('john.doe@universitaspertamina.ac.id')).toBeInTheDocument()
    })
})
