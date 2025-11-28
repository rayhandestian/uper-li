/**
 * Environment variable validation utility
 * Validates critical security configuration at application startup
 */

import { logger } from './logger'

interface ValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
}

/**
 * Validate NEXTAUTH_SECRET meets security requirements
 */
function validateNextAuthSecret(): ValidationResult {
    const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: []
    }

    const secret = process.env.NEXTAUTH_SECRET

    // Check if secret exists
    if (!secret) {
        result.valid = false
        result.errors.push('NEXTAUTH_SECRET is not defined')
        return result
    }

    // Check minimum length (should be at least 32 characters for 256-bit security)
    if (secret.length < 32) {
        result.valid = false
        result.errors.push(
            `NEXTAUTH_SECRET is too short (${secret.length} chars). Minimum 32 characters required for security.`
        )
    }

    // Check if it's a placeholder/example value
    const insecurePatterns = [
        'your-nextauth-secret',
        'change-me',
        'example',
        '123456',
        'nextauth-secret-here'
    ]

    const lowerSecret = secret.toLowerCase()
    for (const pattern of insecurePatterns) {
        if (lowerSecret.includes(pattern)) {
            result.valid = false
            result.errors.push(
                `NEXTAUTH_SECRET appears to be a placeholder or weak value. Use cryptographically random string.`
            )
            break
        }
    }

    // Warn if secret looks like it might be reused across environments
    if (process.env.NODE_ENV === 'production') {
        // In production, warn about common development values
        if (secret.includes('dev') || secret.includes('test')) {
            result.warnings.push(
                'NEXTAUTH_SECRET may be a development value. Ensure production uses unique secret.'
            )
        }
    }

    // Check entropy (basic check - should have variety of characters)
    const uniqueChars = new Set(secret).size
    if (uniqueChars < 16) {
        result.warnings.push(
            `NEXTAUTH_SECRET has low character diversity (${uniqueChars} unique chars). Consider regenerating.`
        )
    }

    return result
}

/**
 * Validate all critical environment variables
 * Called at application startup
 */
export function validateEnvironment(): void {
    logger.info('Validating environment configuration...')

    const results: ValidationResult[] = []

    // Validate NextAuth secret
    const nextAuthResult = validateNextAuthSecret()
    results.push(nextAuthResult)

    // Log all warnings
    results.forEach(result => {
        result.warnings.forEach(warning => {
            logger.warn(`Environment validation warning: ${warning}`)
        })
    })

    // Log all errors and throw if any validation failed
    const hasErrors = results.some(result => !result.valid)

    if (hasErrors) {
        results.forEach(result => {
            result.errors.forEach(error => {
                logger.error(`Environment validation error: ${error}`)
            })
        })

        throw new Error(
            'Critical environment validation failed. Application cannot start safely. ' +
            'Please check logs for details.'
        )
    }

    logger.info('Environment validation passed ✓')
}
