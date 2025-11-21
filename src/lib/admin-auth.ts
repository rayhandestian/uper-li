import crypto from 'crypto'

function getAdminSecret(): string {
  const secret = process.env.ADMIN_PASSCODE
  if (!secret) {
    throw new Error('ADMIN_PASSCODE environment variable must be set')
  }
  return secret
}

export function signAdminToken(): string {
    // Create a token with a timestamp and a signature
    const timestamp = Date.now().toString()
    const payload = Buffer.from(JSON.stringify({ admin: true, timestamp })).toString('base64')
    const signature = crypto
        .createHmac('sha256', getAdminSecret())
        .update(payload)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

    return `${payload}.${signature}`
}

export function verifyAdminToken(token: string | undefined | null): boolean {
    if (!token) return false

    const [payload, signature] = token.split('.')
    if (!payload || !signature) return false

    // Re-calculate signature
    const expectedSignature = crypto
        .createHmac('sha256', getAdminSecret())
        .update(payload)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

    // Constant-time comparison
    const sigBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSignature)

    if (sigBuffer.length !== expectedBuffer.length) return false
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer)
}
