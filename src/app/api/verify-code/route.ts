import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withRateLimit } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

// Helper function to extract client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  return request.headers.get('x-client-ip') || 'unknown'
}

// IP-based rate limiting storage (in production, use Redis or database)
const ipAttempts = new Map<string, { count: number; resetTime: number }>()
const IP_RATE_LIMIT = 10 // 10 attempts per hour per IP
const IP_WINDOW_MS = 60 * 60 * 1000 // 1 hour

// Code-based rate limiting storage
const codeAttempts = new Map<string, { count: number; resetTime: number }>()
const CODE_RATE_LIMIT = 5 // 5 attempts per 10 minutes per code
const CODE_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

function checkIPRateLimit(ip: string): boolean {
  const now = Date.now()
  const ipData = ipAttempts.get(ip)
  
  if (!ipData || now > ipData.resetTime) {
    ipAttempts.set(ip, { count: 1, resetTime: now + IP_WINDOW_MS })
    return true
  }
  
  if (ipData.count >= IP_RATE_LIMIT) {
    return false
  }
  
  ipData.count++
  return true
}

function checkCodeRateLimit(code: string): boolean {
  const now = Date.now()
  const codeData = codeAttempts.get(code)
  
  if (!codeData || now > codeData.resetTime) {
    codeAttempts.set(code, { count: 1, resetTime: now + CODE_WINDOW_MS })
    return true
  }
  
  if (codeData.count >= CODE_RATE_LIMIT) {
    return false
  }
  
  codeData.count++
  return true
}

async function handleVerification(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    const { code } = await request.json()

    if (!code || code.length !== 6) {
      logger.warn(`Invalid verification code format from IP: ${clientIP}`, { code: code?.length })
      return NextResponse.json({ error: 'Kode verifikasi diperlukan dan harus 6 digit.' }, { status: 400 })
    }

    // Check IP-based rate limiting
    if (!checkIPRateLimit(clientIP)) {
      logger.warn(`IP rate limit exceeded for: ${clientIP}`, { code })
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi nanti.' }, { status: 429 })
    }

    // Check code-based rate limiting  
    if (!checkCodeRateLimit(code)) {
      logger.warn(`Code rate limit exceeded for code: ${code} from IP: ${clientIP}`)
      return NextResponse.json({ error: 'Terlalu banyak percobaan untuk kode ini. Coba lagi nanti.' }, { status: 429 })
    }

    // Find user by verification code using raw SQL
    const userResult = await db.query(
      'SELECT * FROM "User" WHERE "verificationToken" = $1',
      [code]
    )

    if (userResult.rows.length === 0) {
      logger.info(`Invalid verification code attempt from IP: ${clientIP}`, { code: code.substring(0, 2) + '****' })
      return NextResponse.json({ error: 'Kode verifikasi tidak valid.' }, { status: 400 })
    }

    const user = userResult.rows[0]

    // Check if code has expired
    if (user.verificationTokenExpires && new Date(user.verificationTokenExpires) < new Date()) {
      logger.warn(`Expired verification code attempt from IP: ${clientIP}`, { userId: user.id, code: code.substring(0, 2) + '****' })
      return NextResponse.json({ error: 'Kode verifikasi telah kadaluarsa.' }, { status: 400 })
    }

    // Check if already verified
    if (user.emailVerified) {
      logger.warn(`Already verified account attempt from IP: ${clientIP}`, { userId: user.id, code: code.substring(0, 2) + '****' })
      return NextResponse.json({ error: 'Akun sudah diverifikasi.' }, { status: 400 })
    }

    // Additional security: Check if verification code was generated recently (within 24 hours)
    const verificationTokenGenerated = user.updatedAt // This gets updated when token is set
    const now = new Date()
    const tokenAge = now.getTime() - new Date(verificationTokenGenerated).getTime()
    const maxTokenAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

    if (tokenAge > maxTokenAge) {
      logger.warn(`Old verification code attempt from IP: ${clientIP}`, { 
        userId: user.id, 
        tokenAge: Math.round(tokenAge / (1000 * 60 * 60)) + ' hours',
        code: code.substring(0, 2) + '****' 
      })
      return NextResponse.json({ error: 'Kode verifikasi telah kadaluarsa. Silakan daftar ulang.' }, { status: 400 })
    }

    // Log successful verification attempt
    logger.info(`Successful verification from IP: ${clientIP}`, { 
      userId: user.id, 
      nimOrUsername: user.nimOrUsername,
      role: user.role 
    })

    // Verify email using raw SQL
    await db.query(
      `UPDATE "User"
       SET "emailVerified" = NOW(), "verificationToken" = null, "verificationTokenExpires" = null, "updatedAt" = NOW()
       WHERE id = $1`,
      [user.id]
    )

    // Clear rate limiting data for this code on successful verification
    codeAttempts.delete(code)

    return NextResponse.json({ message: 'Verifikasi berhasil.' })
  } catch (error) {
    logger.error('Code verification error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

export const POST = handleVerification