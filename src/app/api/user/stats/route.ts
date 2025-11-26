import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user data using Prisma with active links count
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                totalLinks: true,
                monthlyLinksCreated: true,
                role: true,
                _count: {
                    select: {
                        Link: {
                            where: { active: true }
                        }
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({
            totalLinks: user.totalLinks,
            monthlyLinks: user.monthlyLinksCreated,
            role: user.role,
            totalActiveLinks: user._count.Link,
        })
    } catch (error) {
        logger.error('Error fetching user stats:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
