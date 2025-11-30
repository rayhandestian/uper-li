/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import Footer from '../Footer'

// Mock Next.js Link component
jest.mock('next/link', () => {
    return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
        return <a href={href} {...props}>{children}</a>
    }
})

describe('Footer', () => {
    it('renders the footer with correct content', () => {
        render(<Footer />)

        // Check copyright text
        expect(screen.getByText('© 2025 UPer.li')).toBeInTheDocument()

        // Check navigation links
        expect(screen.getByText('Syarat dan Ketentuan')).toBeInTheDocument()
        expect(screen.getByText('Kebijakan Privasi')).toBeInTheDocument()
        expect(screen.getByText('Hubungi Kami')).toBeInTheDocument()
    })

    it('renders navigation links with correct hrefs', () => {
        render(<Footer />)

        const links = screen.getAllByRole('link')

        // Should have 4 links total (copyright + 3 nav links)
        expect(links).toHaveLength(4)

        // Check hrefs
        expect(links[0]).toHaveAttribute('href', '/') // Copyright link
        expect(links[1]).toHaveAttribute('href', '/terms')
        expect(links[2]).toHaveAttribute('href', '/privacy')
        expect(links[3]).toHaveAttribute('href', '/contact')
    })

    it('has correct styling classes', () => {
        const { container } = render(<Footer />)

        // Check main footer element
        const footer = container.firstChild as HTMLElement
        expect(footer).toHaveClass('bg-white', 'border-t', 'border-gray-200', 'mt-16')

        // Check container div
        const containerDiv = footer.firstChild as HTMLElement
        expect(containerDiv).toHaveClass('max-w-7xl', 'mx-auto', 'py-12', 'px-4', 'sm:px-6', 'lg:px-8')
    })

    it('renders with responsive layout classes', () => {
        const { container } = render(<Footer />)

        // Check the flex container
        const flexContainer = container.querySelector('.flex')
        expect(flexContainer).toHaveClass('flex-col', 'md:flex-row', 'justify-between', 'items-center', 'gap-6')
    })
})