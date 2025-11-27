import crypto from 'crypto'
import { prisma } from './prisma'
import { Admin, AdminSession } from '@prisma/client'
import { NextRequest } from 'next/server'

// Constants for session management
const SESSION_TIMEOUT_MINUTES = parseInt(process.env.ADMIN_SESSION_TIMEOUT_MINUTES || '30')
const SESSION_MAX_LIFETIME_HOURS = parseInt(process.env.ADMIN_SESSION_MAX_LIFETIME_HOURS || '12')
const TOKEN_BYTES = 32 // 256 bits

/**
 * Generate a cryptographically secure random session token
 * @returns 64-character hexadecimal string
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex')
}

/**
 * Hash a session token for storage in database
 * Uses SHA-256 to prevent token theft from database
 * @param token Plain session token
 * @returns SHA-256 hash in hexadecimal format
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Extract client IP address from request
 * Handles proxy headers (x-forwarded-for, x-real-ip)
 */
function getClientIP(req: NextRequest): string | undefined {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  const realIP = req.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  return undefined
}

/**
 * Extract user agent from request
 */
function getUserAgent(req: NextRequest): string | undefined {
  return req.headers.get('user-agent') || undefined
}

/**
 * Create a new admin session
 * @param adminId ID of the admin user
 * @param req Next.js request object for capturing IP and user agent
 * @returns Session object including plain token (only time it's available)
 */
export async function createAdminSession(
  adminId: string,
  req?: NextRequest
): Promise<{ session: AdminSession; token: string }> {
  const token = generateSessionToken()
  const hashedToken = hashSessionToken(token)

  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_MAX_LIFETIME_HOURS * 60 * 60 * 1000)

  const session = await prisma.adminSession.create({
    data: {
      adminId,
      token: hashedToken,
      ipAddress: req ? getClientIP(req) : undefined,
      userAgent: req ? getUserAgent(req) : undefined,
      expiresAt,
      lastActivityAt: now
    }
  })

  // Update admin's last login time
  await prisma.admin.update({
    where: { id: adminId },
    data: { lastLoginAt: now }
  })

  return { session, token }
}

/**
 * Validate an admin session token and return the admin if valid
 * Checks:
 * - Token exists in database
 * - Session not revoked
 * - Session not expired (absolute and inactivity timeout)
 * - Admin account is active
 * 
 * @param token Plain session token from cookie
 * @returns Admin object if valid, null otherwise
 */
export async function validateAdminSession(token: string | undefined | null): Promise<Admin | null> {
  if (!token) return null

  const hashedToken = hashSessionToken(token)
  const now = new Date()

  const session = await prisma.adminSession.findUnique({
    where: { token: hashedToken },
    include: { admin: true }
  })

  if (!session) return null

  // Check if session is revoked
  if (session.revokedAt) return null

  // Check absolute expiration
  if (session.expiresAt < now) {
    // Session expired, revoke it
    await prisma.adminSession.update({
      where: { id: session.id },
      data: { revokedAt: now }
    })
    return null
  }

  // Check inactivity timeout
  const inactivityTimeout = new Date(session.lastActivityAt.getTime() + SESSION_TIMEOUT_MINUTES * 60 * 1000)
  if (inactivityTimeout < now) {
    // Inactive too long, revoke it
    await prisma.adminSession.update({
      where: { id: session.id },
      data: { revokedAt: now }
    })
    return null
  }

  // Check if admin account is active
  if (!session.admin.active) return null

  return session.admin
}

/**
 * Update session activity timestamp
 * Called on each authenticated request to extend inactivity timeout
 */
export async function extendSessionActivity(token: string): Promise<void> {
  const hashedToken = hashSessionToken(token)

  await prisma.adminSession.updateMany({
    where: {
      token: hashedToken,
      revokedAt: null
    },
    data: {
      lastActivityAt: new Date()
    }
  })
}

/**
 * Revoke a specific admin session
 * @param token Plain session token or hashed token
 */
export async function revokeAdminSession(token: string): Promise<void> {
  const hashedToken = hashSessionToken(token)

  await prisma.adminSession.updateMany({
    where: { token: hashedToken },
    data: { revokedAt: new Date() }
  })
}

/**
 * Revoke all sessions for an admin
 * Used when changing password or for security purposes
 */
export async function revokeAllAdminSessions(adminId: string): Promise<number> {
  const result = await prisma.adminSession.updateMany({
    where: {
      adminId,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  })

  return result.count
}

/**
 * Revoke a specific session by ID
 * Used in session management UI
 */
export async function revokeAdminSessionById(sessionId: string): Promise<void> {
  await prisma.adminSession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() }
  })
}

/**
 * Cleanup expired and revoked sessions
 * Should be called by cron job
 * @returns Number of sessions deleted
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const now = new Date()

  const result = await prisma.adminSession.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        {
          AND: [
            { revokedAt: { not: null } },
            { revokedAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } } // Keep revoked sessions for 7 days for audit
          ]
        }
      ]
    }
  })

  return result.count
}

/**
 * Get all active sessions for an admin
 * Used in session management UI
 */
export async function getAdminSessions(adminId: string) {
  return await prisma.adminSession.findMany({
    where: {
      adminId,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { lastActivityAt: 'desc' },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      lastActivityAt: true,
      expiresAt: true
    }
  })
}

// ========================================
// DEPRECATED FUNCTIONS (Legacy Support)
// ========================================

/**
 * @deprecated Use session-based authentication instead
 * Legacy function for backward compatibility during migration
 */
function getAdminSecret(): string {
  const secret = process.env.ADMIN_PASSCODE
  if (!secret) {
    throw new Error('ADMIN_PASSCODE environment variable must be set')
  }
  return secret
}

/**
 * @deprecated Use createAdminSession() instead
 * Legacy function for backward compatibility during migration
 */
export function signAdminToken(): string {
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

/**
 * @deprecated Use validateAdminSession() instead
 * Legacy function for backward compatibility during migration
 */
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
