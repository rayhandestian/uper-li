import { generateSecureCode, isValidCodeFormat, normalizeCode } from '../generateSecureCode'

describe('generateSecureCode', () => {
    it('should generate code of correct length', () => {
        const code = generateSecureCode(6)
        expect(code).toHaveLength(6)
    })

    it('should generate unique codes', () => {
        const codes = new Set()
        for (let i = 0; i < 1000; i++) {
            codes.add(generateSecureCode())
        }
        // Should have 1000 unique codes (collision extremely unlikely)
        expect(codes.size).toBe(1000)
    })

    it('should only use allowed characters', () => {
        const code = generateSecureCode()
        expect(code).toMatch(/^[23456789abcdefghjkmnpqrstuvwxyz]{6}$/)
    })

    it('should not contain confusing characters', () => {
        const code = generateSecureCode()
        expect(code).not.toMatch(/[01oli]/)
    })

    it('should validate correct code format', () => {
        expect(isValidCodeFormat('a7x9k2')).toBe(true)
        expect(isValidCodeFormat('ABC123')).toBe(true) // case-insensitive
        expect(isValidCodeFormat('234567')).toBe(true)
    })

    it('should reject invalid formats', () => {
        expect(isValidCodeFormat('12345')).toBe(false) // too short
        expect(isValidCodeFormat('abcdefg')).toBe(false) // too long
        expect(isValidCodeFormat('abc-123')).toBe(false) // invalid char
        expect(isValidCodeFormat('')).toBe(false) // empty
    })

    it('should normalize codes', () => {
        expect(normalizeCode('ABC123')).toBe('abc123')
        expect(normalizeCode(' a7x9k2 ')).toBe('a7x9k2')
        expect(normalizeCode('  XYZ789  ')).toBe('xyz789')
    })

    it('should generate different lengths when specified', () => {
        const code4 = generateSecureCode(4)
        const code8 = generateSecureCode(8)
        expect(code4).toHaveLength(4)
        expect(code8).toHaveLength(8)
    })
})
