import { HTMLAttributes, forwardRef } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'bordered'
    hoverable?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ variant = 'default', hoverable = false, padding = 'md', className = '', children, ...props }, ref) => {
        const baseStyles = 'bg-white rounded-lg transition-all duration-200'

        const variantStyles = {
            default: 'border border-gray-200 shadow-sm',
            elevated: 'shadow-md',
            bordered: 'border-2 border-gray-200'
        }

        const hoverStyles = hoverable ? 'hover:shadow-lg hover:border-gray-300 cursor-pointer' : ''

        const paddingStyles = {
            none: '',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8'
        }

        return (
            <div
                ref={ref}
                className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${paddingStyles[padding]} ${className}`}
                {...props}
            >
                {children}
            </div>
        )
    }
)

Card.displayName = 'Card'

export default Card
