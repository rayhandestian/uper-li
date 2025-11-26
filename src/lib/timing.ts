import bcrypt from 'bcryptjs'

/**
 * Add a constant random delay to prevent timing attacks
 * @param minMs Minimum delay in milliseconds
 * @param maxMs Maximum delay in milliseconds
 */
export async function addConstantDelay(minMs: number = 100, maxMs: number = 200): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * Perform a dummy bcrypt hash operation to maintain constant timing
 * This prevents timing attacks when user doesn't exist
 */
export async function performDummyHash(): Promise<void> {
    await bcrypt.hash('dummy-password-for-timing', 12)
}
