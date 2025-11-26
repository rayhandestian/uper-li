import crypto from 'crypto'

/**
 * Characters used for verification codes
 * Excludes: 0, 1, o, l, i (to prevent confusion)
 */
const CODE_CHARS = '23456789abcdefghjkmnpqrstuvwxyz'

/**
 * Generate a cryptographically secure verification code
 * @param length - Length of the code (default 6)
 * @returns Alphanumeric code string
 */
export function generateSecureCode(length: number = 6): string {
    let code = ''

    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, CODE_CHARS.length)
        code += CODE_CHARS[randomIndex]
    }

    return code
}

/**
 * Validate a verification code format
 * @param code - Code to validate
 * @returns True if code matches expected format
 */
export function isValidCodeFormat(code: string): boolean {
    // Allow 6 characters, alphanumeric (case-insensitive)
    const codeRegex = /^[a-z0-9]{6}$/i
    return codeRegex.test(code)
}

/**
 * Normalize code for comparison (lowercase, trim)
 * @param code - Code to normalize
 * @returns Normalized code
 */
export function normalizeCode(code: string): string {
    return code.toLowerCase().trim()
}
