import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { getCurrentMonthString } from '@/lib/dateUtils'

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
                currentMonth: true,
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

        // Lazy monthly reset
        const currentMonthString = getCurrentMonthString()
        if (user.currentMonth !== currentMonthString) {
            const updatedUser = await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    monthlyLinksCreated: 0,
                    currentMonth: currentMonthString,
                    lastReset: new Date(),
                    updatedAt: new Date()
                },
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

            return NextResponse.json({
                totalLinks: updatedUser.totalLinks,
                monthlyLinks: updatedUser.monthlyLinksCreated,
                role: updatedUser.role,
                totalActiveLinks: updatedUser._count.Link,
            })
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
