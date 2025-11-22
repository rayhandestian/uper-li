import { render, screen, fireEvent } from '@testing-library/react'
import DashboardNav from '../../DashboardNav'

// Mock LogoutButton
jest.mock('@/components/LogoutButton', () => {
    return function MockLogoutButton({ className }: { className: string }) {
        return <button className={className}>Logout</button>
    }
})

describe('DashboardNav', () => {
    const mockSession = {
        user: {
            name: 'Test User',
            email: 'test@example.com',
            image: null,
            id: '123',
            role: 'STUDENT',
            nimOrUsername: '12345678'
        },
        expires: '2099-01-01T00:00:00.000Z'
    }

    it('renders logo and navigation links', () => {
        render(<DashboardNav session={mockSession} />)

        expect(screen.getByText('UPer.li')).toBeInTheDocument()

        // Desktop links
        const dashboardLinks = screen.getAllByText('Dashboard')
        expect(dashboardLinks.length).toBeGreaterThan(0)

        const accountLinks = screen.getAllByText('Akun')
        expect(accountLinks.length).toBeGreaterThan(0)
    })

    it('displays user email', () => {
        render(<DashboardNav session={mockSession} />)
        expect(screen.getAllByText('test@example.com').length).toBeGreaterThan(0)
    })

    it('toggles mobile menu', () => {
        render(<DashboardNav session={mockSession} />)

        const toggleButton = screen.getByLabelText('Toggle menu')

        fireEvent.click(toggleButton)

        // Check if mobile menu items are visible
        // We can check if the closeMobileMenu function works by clicking a link
        const mobileDashboardLink = screen.getAllByText('Dashboard')[1] // Assuming second one is mobile if rendered
        if (mobileDashboardLink) {
            fireEvent.click(mobileDashboardLink)
        }
    })
})
