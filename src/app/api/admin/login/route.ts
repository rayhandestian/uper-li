import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { passcode } = await request.json()

    if (!passcode) {
      return NextResponse.json({ error: 'Passcode is required' }, { status: 400 })
    }

    const adminPasscode = process.env.ADMIN_PASSCODE
    if (!adminPasscode) {
      return NextResponse.json({ error: 'Admin passcode not configured' }, { status: 500 })
    }

    if (passcode !== adminPasscode) {
      return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 })
    }

    // Set cookie for admin auth
    const cookieStore = await cookies()
    cookieStore.set('admin_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}