import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { manualMonthlyReset, manualLinkCleanup } from '@/lib/cron'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { action } = await request.json()

  try {
    switch (action) {
      case 'monthly_reset':
        const resetResult = await manualMonthlyReset()
        return NextResponse.json(resetResult)

      case 'link_cleanup':
        const cleanupResult = await manualLinkCleanup()
        return NextResponse.json(cleanupResult)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}