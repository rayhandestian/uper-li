import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateAdminSession, getAdminSessions, hashSessionToken } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const sessionToken = cookieStore.get('admin_session')?.value

        // Verify session
        const admin = await validateAdminSession(sessionToken)
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get all active sessions for this admin
        const sessions = await getAdminSessions(admin.id)

        // Hash current token to identify which session is current
        const currentTokenHash = sessionToken ? hashSessionToken(sessionToken) : null

        // Map sessions and mark the current one
        const sessionsWithCurrent = sessions.map(session => ({
            ...session,
            current: session.id === currentTokenHash
        }))

        return NextResponse.json({ sessions: sessionsWithCurrent })
    } catch (error) {
        logger.error('Admin sessions list error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
