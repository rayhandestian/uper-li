/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ManualCronJobs from '../ManualCronJobs'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Setup window mocks with cleanup
const setupWindowMocks = () => {
    const mockConfirm = jest.fn().mockReturnValue(true)
    const mockAlert = jest.fn()

    window.confirm = mockConfirm
    window.alert = mockAlert

    return {
        mockConfirm,
        mockAlert,
        cleanup: () => {
            jest.restoreAllMocks()
        }
    }
}

describe('ManualCronJobs', () => {
    let windowMocks: ReturnType<typeof setupWindowMocks>

    beforeEach(() => {
        jest.clearAllMocks()
        windowMocks = setupWindowMocks()
        mockFetch.mockClear()
    })

    afterEach(() => {
        windowMocks.cleanup()
    })

    it('renders the component with correct title and buttons', () => {
        render(<ManualCronJobs />)

        expect(screen.getByText('Manual Maintenance Tasks')).toBeInTheDocument()
        expect(screen.getByText('Run Monthly Reset')).toBeInTheDocument()
        expect(screen.getByText('Run Link Cleanup')).toBeInTheDocument()
        expect(screen.getByText('These tasks normally run automatically via cron jobs.')).toBeInTheDocument()
    })

    it('calls monthly reset API when Run Monthly Reset button is clicked', async () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ success: true, usersUpdated: 5, linksUpdated: 10 })
        })

        render(<ManualCronJobs />)

        const button = screen.getByText('Run Monthly Reset')
        fireEvent.click(button)

        await waitFor(() => {
            expect(windowMocks.mockConfirm).toHaveBeenCalledWith('Are you sure you want to run the monthly reset? This will reset all users\' monthly link creation counts and custom URL change limits.')
            expect(mockFetch).toHaveBeenCalledWith('/api/admin/cron', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'monthly_reset' })
            })
            expect(windowMocks.mockAlert).toHaveBeenCalledWith('Reset completed: 5 users and 10 links updated')
        })
    })

    it('calls link cleanup API when Run Link Cleanup button is clicked', async () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ success: true, linksDeactivated: 3 })
        })

        render(<ManualCronJobs />)

        const button = screen.getByText('Run Link Cleanup')
        fireEvent.click(button)

        await waitFor(() => {
            expect(windowMocks.mockConfirm).toHaveBeenCalledWith('Are you sure you want to run the link cleanup? This will deactivate links that haven\'t been visited in 5 months.')
            expect(mockFetch).toHaveBeenCalledWith('/api/admin/cron', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'link_cleanup' })
            })
            expect(windowMocks.mockAlert).toHaveBeenCalledWith('Cleanup completed: 3 links deactivated')
        })
    })

    it('shows error alert when monthly reset fails', async () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ success: false, error: 'Database error' })
        })

        render(<ManualCronJobs />)

        const button = screen.getByText('Run Monthly Reset')
        fireEvent.click(button)

        await waitFor(() => {
            expect(windowMocks.mockAlert).toHaveBeenCalledWith('Error: Database error')
        })
    })

    it('shows error alert when link cleanup fails', async () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ success: false, error: 'Network error' })
        })

        render(<ManualCronJobs />)

        const button = screen.getByText('Run Link Cleanup')
        fireEvent.click(button)

        await waitFor(() => {
            expect(windowMocks.mockAlert).toHaveBeenCalledWith('Error: Network error')
        })
    })

    it('does not call API when user cancels confirmation for monthly reset', () => {
        windowMocks.mockConfirm.mockReturnValue(false)

        render(<ManualCronJobs />)

        const button = screen.getByText('Run Monthly Reset')
        fireEvent.click(button)

        expect(windowMocks.mockConfirm).toHaveBeenCalled()
        expect(mockFetch).not.toHaveBeenCalled()
        expect(windowMocks.mockAlert).not.toHaveBeenCalled()
    })

    it('does not call API when user cancels confirmation for link cleanup', () => {
        windowMocks.mockConfirm.mockReturnValue(false)

        render(<ManualCronJobs />)

        const button = screen.getByText('Run Link Cleanup')
        fireEvent.click(button)

        expect(windowMocks.mockConfirm).toHaveBeenCalled()
        expect(mockFetch).not.toHaveBeenCalled()
        expect(windowMocks.mockAlert).not.toHaveBeenCalled()
    })
})