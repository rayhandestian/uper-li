/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import NotFound from '../not-found'

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

describe('NotFound Page', () => {
    it('renders the 404 page correctly', () => {
        render(<NotFound />)

        // Check main heading
        expect(screen.getByText('Halaman Tidak Ditemukan')).toBeInTheDocument()

        // Check description
        expect(screen.getByText('URL yang Anda cari tidak tersedia.')).toBeInTheDocument()

        // Check possible causes list
        expect(screen.getByText('Kemungkinan penyebab:')).toBeInTheDocument()
        expect(screen.getByText('• Halaman sudah dihapus atau dipindahkan')).toBeInTheDocument()
        expect(screen.getByText('• URL yang Anda masukkan salah')).toBeInTheDocument()
        expect(screen.getByText('• Link sudah kedaluwarsa')).toBeInTheDocument()

        // Check back to home buttons
        expect(screen.getAllByText('Kembali ke Beranda')).toHaveLength(2)

        // Check footer is rendered
        expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('renders with correct structure and styling', () => {
        const { container } = render(<NotFound />)

        // Check main container has gradient background
        const mainContainer = container.firstChild
        expect(mainContainer).toHaveClass('min-h-screen', 'gradient-bg', 'flex', 'flex-col')

        // Check the white card container
        const whiteCard = screen.getByText('Halaman Tidak Ditemukan').closest('.bg-white')
        expect(whiteCard).toHaveClass('bg-white', 'rounded-2xl', 'shadow-xl', 'p-8', 'border', 'border-gray-100')
    })

    it('has working navigation links', () => {
        render(<NotFound />)

        const links = screen.getAllByRole('link')
        expect(links).toHaveLength(2)

        // Both links should point to home
        links.forEach(link => {
            expect(link).toHaveAttribute('href', '/')
        })
    })

    it('displays SVG icon in the back button', () => {
        render(<NotFound />)

        // Check for the SVG arrow icon
        const svg = document.querySelector('svg')
        expect(svg).toBeInTheDocument()
        expect(svg).toHaveAttribute('stroke', 'currentColor')
        expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    })
})