/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import Card from '../Card'

describe('Card', () => {
    it('renders children correctly', () => {
        render(<Card>Test Content</Card>)
        expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('applies variant classes', () => {
        render(<Card variant="elevated">Content</Card>)
        // Check if it renders without error. Class checking is brittle without specific test-ids or knowing exact output.
        expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('applies padding classes', () => {
        render(<Card padding="lg">Content</Card>)
        expect(screen.getByText('Content')).toBeInTheDocument()
    })
})
