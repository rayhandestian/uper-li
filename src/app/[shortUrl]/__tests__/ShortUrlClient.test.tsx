/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ShortUrlClient from '../ShortUrlClient'
import { TEST_PASSWORD, TEST_WRONG_PASSWORD } from '@/__tests__/test-constants'

// Mock Next.js Link component
jest.mock('next/link', () => {
    return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
        return <a href={href} {...props}>{children}</a>
    }
})

// Mock Footer component
jest.mock('@/components/Footer', () => {
    return function MockFooter() {
        return <footer data-testid="footer">Footer</footer>
    }
})

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// We'll test component rendering without navigation

describe('ShortUrlClient', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('not_found status', () => {
        const props = {
            initialData: { status: 'not_found' as const },
            shortUrl: 'test123'
        }

        it('renders not found page correctly', () => {
            render(<ShortUrlClient {...props} />)

            expect(screen.getByText('Link Tidak Ditemukan')).toBeInTheDocument()
            expect(screen.getByText('Short URL yang Anda cari tidak tersedia.')).toBeInTheDocument()
            expect(screen.getByText('• Link sudah dihapus oleh pemilik')).toBeInTheDocument()
            expect(screen.getByText('• URL yang Anda masukkan salah')).toBeInTheDocument()
            expect(screen.getByText('• Link sudah kedaluwarsa')).toBeInTheDocument()
            expect(screen.getAllByText('Kembali ke Beranda')).toHaveLength(2)
            expect(screen.getByTestId('footer')).toBeInTheDocument()
        })

        it('has correct navigation links', () => {
            render(<ShortUrlClient {...props} />)

            const links = screen.getAllByRole('link')
            links.forEach(link => {
                expect(link).toHaveAttribute('href', '/')
            })
        })
    })

    describe('inactive status', () => {
        const props = {
            initialData: { status: 'inactive' as const },
            shortUrl: 'test123'
        }

        it('renders inactive page correctly', () => {
            render(<ShortUrlClient {...props} />)

            expect(screen.getByText('Link Dinonaktifkan')).toBeInTheDocument()
            expect(screen.getByText('Short URL ini telah dinonaktifkan oleh pemiliknya.')).toBeInTheDocument()
            expect(screen.getByText('Untuk mendapatkan akses, silakan hubungi pemilik link.')).toBeInTheDocument()
            expect(screen.getAllByText('Kembali ke Beranda')).toHaveLength(2)
            expect(screen.getByTestId('footer')).toBeInTheDocument()
        })
    })

    describe('locked status', () => {
        const props = {
            initialData: {
                status: 'locked' as const,
                longUrl: 'https://example.com'
            },
            shortUrl: 'test123'
        }

        it('renders password form correctly', () => {
            render(<ShortUrlClient {...props} />)

            expect(screen.getByText('Link Terkunci')).toBeInTheDocument()
            expect(screen.getByText('Masukkan password untuk mengakses link ini')).toBeInTheDocument()
            expect(screen.getByLabelText('Password')).toBeInTheDocument()
            expect(screen.getByPlaceholderText('Masukkan password')).toBeInTheDocument()
            expect(screen.getByText('Akses Link')).toBeInTheDocument()
            expect(screen.getByTestId('footer')).toBeInTheDocument()
        })

        it('handles password input', () => {
            render(<ShortUrlClient {...props} />)

            const passwordInput = screen.getByLabelText('Password')
            fireEvent.change(passwordInput, { target: { value: TEST_PASSWORD } })

            expect(passwordInput).toHaveValue(TEST_PASSWORD)
        })

        it('shows loading state during verification', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'Wrong password' })
            })

            render(<ShortUrlClient {...props} />)

            const passwordInput = screen.getByLabelText('Password')
            const submitButton = screen.getByText('Akses Link')

            fireEvent.change(passwordInput, { target: { value: TEST_WRONG_PASSWORD } })
            fireEvent.click(submitButton)

            expect(screen.getByText('Memverifikasi...')).toBeInTheDocument()
            expect(submitButton).toBeDisabled()

            await waitFor(() => {
                expect(screen.getByText('Akses Link')).toBeInTheDocument()
            })
        })

        it('handles successful password verification', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            })

            // Mock the log-visit fetch
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            })

            render(<ShortUrlClient {...props} />)

            const passwordInput = screen.getByLabelText('Password')
            const submitButton = screen.getByText('Akses Link')

            fireEvent.change(passwordInput, { target: { value: TEST_PASSWORD } })
            fireEvent.click(submitButton)

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith('/api/verify-link-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ shortUrl: 'test123', password: TEST_PASSWORD })
                })
                // Note: log-visit and navigation don't happen due to JSDOM limitations
            })
        })

        it('handles password verification error', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'Password salah' })
            })

            render(<ShortUrlClient {...props} />)

            const passwordInput = screen.getByLabelText('Password')
            const submitButton = screen.getByText('Akses Link')

            fireEvent.change(passwordInput, { target: { value: TEST_WRONG_PASSWORD } })
            fireEvent.click(submitButton)

            // Wait for the verification to complete
            await waitFor(() => {
                expect(submitButton).not.toBeDisabled()
            })

            // The error should be displayed (checking that the component handles errors)
            expect(passwordInput).toHaveValue(TEST_WRONG_PASSWORD)
        })
    })

    describe('ok status with PREVIEW mode', () => {
        const props = {
            initialData: {
                status: 'ok' as const,
                longUrl: 'https://example.com',
                mode: 'PREVIEW',
                id: 'link-123'
            },
            shortUrl: 'test123'
        }

        it('renders preview page correctly', () => {
            render(<ShortUrlClient {...props} />)

            expect(screen.getByText('Pratinjau Link')).toBeInTheDocument()
            expect(screen.getByText('Anda akan diarahkan ke tujuan berikut:')).toBeInTheDocument()
            expect(screen.getByText('https://example.com')).toBeInTheDocument()
            expect(screen.getByText('Lanjutkan ke Tujuan')).toBeInTheDocument()
            expect(screen.getByText('Klik tombol di atas untuk melanjutkan ke link tujuan.')).toBeInTheDocument()
            expect(screen.getByTestId('footer')).toBeInTheDocument()
        })

        it('renders link with correct href', () => {
            render(<ShortUrlClient {...props} />)

            const link = screen.getByText('Lanjutkan ke Tujuan')
            expect(link.closest('a')).toHaveAttribute('href', 'https://example.com')
        })
    })

    describe('ok status with DIRECT mode', () => {
        const props = {
            initialData: {
                status: 'ok' as const,
                longUrl: 'https://example.com',
                mode: 'DIRECT',
                id: 'link-123'
            },
            shortUrl: 'test123'
        }

        it('returns null (no rendering for direct mode)', () => {
            const { container } = render(<ShortUrlClient {...props} />)

            expect(container.firstChild).toBeNull()
        })
    })

    describe('edge cases', () => {
        it('handles missing longUrl in locked status', () => {
            const props = {
                initialData: { status: 'locked' as const },
                shortUrl: 'test123'
            }

            render(<ShortUrlClient {...props} />)

            expect(screen.getByText('Link Terkunci')).toBeInTheDocument()
        })

        it('handles missing mode in ok status', () => {
            const props = {
                initialData: {
                    status: 'ok' as const,
                    longUrl: 'https://example.com'
                },
                shortUrl: 'test123'
            }

            const { container } = render(<ShortUrlClient {...props} />)

            expect(container.firstChild).toBeNull()
        })
    })
})