import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateAdminSession, revokeAdminSessionById } from '@/lib/admin-auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/admin-audit'
import { logger } from '@/lib/logger'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: sessionId } = await params
        const cookieStore = await cookies()
        const sessionToken = cookieStore.get('admin_session')?.value

        // Verify current session
        const admin = await validateAdminSession(sessionToken)
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Revoke the specified session
        await revokeAdminSessionById(sessionId)

        await logAdminAction({
            adminId: admin.id,
            action: AUDIT_ACTIONS.SESSION_REVOKED,
            resource: sessionId,
            req: request
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        logger.error('Admin session revoke error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
