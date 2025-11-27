import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateAdminSession, revokeAllAdminSessions } from '@/lib/admin-auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/admin-audit'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const sessionToken = cookieStore.get('admin_session')?.value

        // Verify session
        const admin = await validateAdminSession(sessionToken)
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Revoke all sessions for this admin
        const count = await revokeAllAdminSessions(admin.id)

        await logAdminAction({
            adminId: admin.id,
            action: AUDIT_ACTIONS.LOGOUT_ALL,
            details: { sessionsRevoked: count },
            req: request
        })

        // Delete current session cookie
        const response = NextResponse.redirect(new URL('/login-admin', process.env.NEXTAUTH_URL || 'http://localhost:3000'))
        response.cookies.delete('admin_session')

        return response
    } catch (error) {
        logger.error('Admin logout-all error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
