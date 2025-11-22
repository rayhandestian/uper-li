import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('admin_auth')

    return NextResponse.redirect(new URL('/login-admin', process.env.NEXTAUTH_URL || 'http://localhost:3000'))
  } catch (error) {
    logger.error('Admin logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}