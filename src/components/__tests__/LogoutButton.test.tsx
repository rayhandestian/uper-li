/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LogoutButton from '../LogoutButton'
import { signOut } from 'next-auth/react'
import { createPortal } from 'react-dom'

// Mock next-auth
jest.mock('next-auth/react', () => ({
    signOut: jest.fn(),
}))

// Mock react-dom createPortal
jest.mock('react-dom', () => ({
    ...jest.requireActual('react-dom'),
    createPortal: jest.fn((children) => children),
}))

describe('LogoutButton', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should render logout button', () => {
        render(<LogoutButton />)

        expect(screen.getByText('Keluar')).toBeInTheDocument()
    })

    it('should open modal on button click', () => {
        render(<LogoutButton />)

        const button = screen.getByText('Keluar')
        fireEvent.click(button)

        expect(screen.getByText('Konfirmasi Keluar')).toBeInTheDocument()
        expect(screen.getByText('Apakah Anda yakin ingin keluar?')).toBeInTheDocument()
    })

    it('should close modal on cancel', () => {
        render(<LogoutButton />)

        // Open modal
        const button = screen.getByText('Keluar')
        fireEvent.click(button)

        // Click cancel (Tidak)
        const cancelButton = screen.getByText('Tidak')
        fireEvent.click(cancelButton)

        // Modal should be closed
        expect(screen.queryByText('Konfirmasi Keluar')).not.toBeInTheDocument()
    })

    it('should call signOut on confirm', () => {
        render(<LogoutButton />)

        // Open modal
        const button = screen.getByText('Keluar')
        fireEvent.click(button)

        // Click confirm (Ya)
        const confirmButton = screen.getByText('Ya')
        fireEvent.click(confirmButton)

        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' })
    })

    it('should use createPortal for modal rendering', () => {
        render(<LogoutButton />)

        // Open modal
        const button = screen.getByText('Keluar')
        fireEvent.click(button)

        expect(createPortal).toHaveBeenCalled()
    })

    it('should close modal on backdrop click', () => {
        render(<LogoutButton />)

        // Open modal
        const button = screen.getByText('Keluar')
        fireEvent.click(button)

        // Find and click the backdrop
        const backdrop = screen.getByText('Konfirmasi Keluar').parentElement?.previousSibling as HTMLElement
        if (backdrop) {
            fireEvent.click(backdrop)
        }

        // Modal should be closed
        waitFor(() => {
            expect(screen.queryByText('Konfirmasi Keluar')).not.toBeInTheDocument()
        })
    })

    it('should apply custom className', () => {
        const customClass = 'custom-test-class'
        render(<LogoutButton className={customClass} />)

        const button = screen.getByText('Keluar')
        expect(button).toHaveClass(customClass)
    })
})
