import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../Button'

describe('Button', () => {
    it('renders children correctly', () => {
        render(<Button>Click me</Button>)
        expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('handles onClick event', () => {
        const handleClick = jest.fn()
        render(<Button onClick={handleClick}>Click me</Button>)
        fireEvent.click(screen.getByText('Click me'))
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('applies variant classes', () => {
        render(<Button variant="danger">Delete</Button>)
        const button = screen.getByText('Delete')
        expect(button).toHaveClass('bg-red-600')
    })

    it('applies fullWidth class when prop is true', () => {
        render(<Button fullWidth>Full Width</Button>)
        const button = screen.getByText('Full Width')
        expect(button).toHaveClass('w-full')
    })

    it('is disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>)
        const button = screen.getByText('Disabled')
        expect(button).toBeDisabled()
    })
})
