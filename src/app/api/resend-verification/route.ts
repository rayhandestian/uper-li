import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sendEmail } from '@/lib/email'
import { getVerificationEmailHtml } from '@/lib/email-templates'
import { db } from '@/lib/db'
import { withRateLimit } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

async function handleResendVerification(request: NextRequest) {
  try {
    const { nimOrUsername, password } = await request.json()

    if (!nimOrUsername) {
      return NextResponse.json({ error: 'NIM/Username diperlukan.' }, { status: 400 })
    }

    if (password && password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 })
    }

    // Construct email from username (same logic as register)
    // We need to determine role from user record to construct proper email
    const userResult = await db.query(
      'SELECT id, email, role, "emailVerified" FROM "User" WHERE "nimOrUsername" = $1',
      [nimOrUsername]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 })
    }

    const user = userResult.rows[0]

    // Check if user is already verified
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Akun sudah diverifikasi. Silakan masuk.' }, { status: 400 })
    }

    // Generate new 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Prepare database update query - update password if provided
    let updateQuery = `UPDATE "User"
                       SET "verificationToken" = $1, "verificationTokenExpires" = $2, "updatedAt" = NOW()`
    const queryParams = [verificationCode, verificationTokenExpires]

    if (password) {
      // Hash password if provided
      const hashedPassword = await bcrypt.hash(password, 12)
      updateQuery += `, password = $4`
      queryParams.push(hashedPassword)
    }

    updateQuery += ` WHERE id = $3`
    queryParams.push(user.id)

    // Update user's verification token and expiry (and password if provided)
    await db.query(updateQuery, queryParams)

    // Log password update for security
    if (password) {
      logger.info(`Password updated for user during resend verification`, { 
        userId: user.id, 
        nimOrUsername,
        timestamp: new Date()
      })
    }

    // Send verification email
    await sendEmail({
      to: user.email,
      from: 'noreply@uper.li',
      subject: 'Verifikasi Akun UPer.li',
      html: getVerificationEmailHtml(verificationCode),
    })

    const message = password 
      ? 'Password berhasil diubah dan kode verifikasi baru telah dikirim ke email Anda.'
      : 'Kode verifikasi baru telah dikirim ke email Anda.'

    return NextResponse.json({ message })
  } catch (error) {
    logger.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

export const POST = withRateLimit(handleResendVerification, { limit: 3, windowMs: 60 * 60 * 1000 }) // 3 attempts per hour