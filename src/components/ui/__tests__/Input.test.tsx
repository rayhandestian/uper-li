/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import Input from '../Input'

describe('Input', () => {
    it('renders correctly', () => {
        render(<Input placeholder="Enter text" />)
        expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('renders label', () => {
        render(<Input label="Username" />)
        expect(screen.getByLabelText('Username')).toBeInTheDocument()
    })

    it('renders error message', () => {
        render(<Input error="Invalid input" />)
        expect(screen.getByText('Invalid input')).toBeInTheDocument()
    })

    it('renders hint', () => {
        render(<Input hint="Helper text" />)
        expect(screen.getByText('Helper text')).toBeInTheDocument()
    })

    it('handles value changes', () => {
        const handleChange = jest.fn()
        render(<Input onChange={handleChange} />)

        const input = screen.getByRole('textbox')
        fireEvent.change(input, { target: { value: 'test' } })

        expect(handleChange).toHaveBeenCalled()
    })
})
