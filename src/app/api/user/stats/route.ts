import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user data using raw SQL
        const userResult = await db.query(`
      SELECT 
        "totalLinks",
        "monthlyLinksCreated" as "monthlyLinks",
        "role"
      FROM "User"
      WHERE id = $1
    `, [session.user.id])

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const user = userResult.rows[0]

        return NextResponse.json({
            totalLinks: user.totalLinks,
            monthlyLinks: user.monthlyLinks,
            role: user.role,
        })
    } catch (error) {
        console.error('Error fetching user stats:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
