import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateAdminSession, revokeAdminSession } from '@/lib/admin-auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/admin-audit'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const sessionToken = cookieStore.get('admin_session')?.value

        // Verify session and get admin
        const admin = await validateAdminSession(sessionToken)

        if (admin && sessionToken) {
            // Revoke the session
            await revokeAdminSession(sessionToken)

            await logAdminAction({
                adminId: admin.id,
                action: AUDIT_ACTIONS.LOGOUT,
                req: request
            })
        }

        // Delete session cookie
        const response = NextResponse.redirect(new URL('/login-admin', process.env.NEXTAUTH_URL || 'http://localhost:3000'))
        response.cookies.delete('admin_session')

        return response
    } catch (error) {
        logger.error('Admin logout error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    return POST(request)
}
