/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react'
import { Providers } from '../providers'

// Mock next-auth SessionProvider
jest.mock('next-auth/react', () => ({
    SessionProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="session-provider">{children}</div>
    ),
}))

describe('Providers', () => {
    it('renders children wrapped in SessionProvider', () => {
        const testContent = <div>Test Child</div>

        const { getByTestId, getByText } = render(
            <Providers>{testContent}</Providers>
        )

        // Check that SessionProvider is rendered
        expect(getByTestId('session-provider')).toBeInTheDocument()

        // Check that children are rendered inside
        expect(getByText('Test Child')).toBeInTheDocument()
    })

    it('passes children correctly', () => {
        const { container } = render(
            <Providers>
                <span>Child 1</span>
                <span>Child 2</span>
            </Providers>
        )

        // Check that both children are rendered
        expect(container.textContent).toContain('Child 1')
        expect(container.textContent).toContain('Child 2')
    })
})