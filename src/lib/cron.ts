import cron from 'node-cron'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

interface Link {
  id: string
  shortUrl: string
  longUrl: string
  userId: string
  active: boolean
  createdAt: Date | null
  lastVisited: Date | null
  email: string
  nimOrUsername: string
}

export const resetMonthlyLimits = async () => {
  logger.info('Running monthly limit reset...')
  try {
    // Reset monthlyLinksCreated for all users using Prisma
    await prisma.user.updateMany({
      data: { monthlyLinksCreated: 0 }
    })

    logger.info('Monthly limit reset completed.')
  } catch (error) {
    logger.error('Monthly limit reset error:', error)
  }
}

export function scheduleMonthlyLimitReset() {
  cron.schedule('0 0 1 * *', resetMonthlyLimits)
}

export const deactivateExpiredLinks = async () => {
  logger.info('Running link deactivation check...')
  try {
    const fiveMonthsAgo = new Date()
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5)

    // Find links that haven't been visited in 5 months and are still active using Prisma
    const linksToDeactivate = await prisma.link.findMany({
      where: {
        active: true,
        OR: [
          { lastVisited: null, createdAt: { lt: fiveMonthsAgo } },
          { lastVisited: { lt: fiveMonthsAgo } }
        ]
      },
      include: {
        user: {
          select: {
            email: true,
            nimOrUsername: true
          }
        }
      }
    })

    if (linksToDeactivate.length > 0) {
      // Send warning emails 1 month before deactivation
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 4)

      const linksForWarning = linksToDeactivate.filter((link) => {
        const createdAt = link.createdAt
        const lastVisited = link.lastVisited
        return createdAt && createdAt <= oneMonthAgo && (!lastVisited || lastVisited <= oneMonthAgo)
      })

      for (const link of linksForWarning) {
        try {
          await sendEmail({
            to: link.user.email,
            from: 'noreply@uper.li',
            subject: 'Pemberitahuan: Link Akan Dinonaktifkan - UPer.li',
            html: `
                            <p>Halo ${link.user.nimOrUsername},</p>
                            <p>Link Anda berikut akan segera dinonaktifkan karena tidak aktif selama 5 bulan:</p>
                            <p><strong>uper.li/${link.shortUrl}</strong></p>
                            <p>Silakan kunjungi link tersebut atau aktifkan kembali di dashboard Anda.</p>
                        `,
          })
        } catch (emailError) {
          logger.error(`Failed to send warning email for link ${link.shortUrl}:`, emailError)
        }
      }

      // Deactivate links
      const linksToDeactivateNow = linksToDeactivate.filter((link) => {
        const createdAt = link.createdAt
        const lastVisited = link.lastVisited
        return createdAt && createdAt <= fiveMonthsAgo && (!lastVisited || lastVisited <= fiveMonthsAgo)
      })

      if (linksToDeactivateNow.length > 0) {
        const linkIds = linksToDeactivateNow.map((link) => link.id)

        const result = await prisma.link.updateMany({
          where: { id: { in: linkIds } },
          data: {
            active: false,
            deactivatedAt: new Date()
          }
        })

        logger.info(`Deactivated ${result.count} links due to inactivity.`)
      }
    }
  } catch (error) {
    logger.error('Link deactivation error:', error)
  }
}

export function scheduleLinkDeactivation() {
  cron.schedule('0 2 * * *', deactivateExpiredLinks)
}

export const deletePermanentLinks = async () => {
  logger.info('Running permanent link deletion check...')
  try {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    // Delete inactive links that were deactivated more than 1 month ago
    const result = await prisma.link.deleteMany({
      where: {
        active: false,
        deactivatedAt: { lt: oneMonthAgo }
      }
    })

    logger.info(`Permanently deleted ${result.count} inactive links.`)
  } catch (error) {
    logger.error('Link deletion error:', error)
  }
}

export function scheduleLinkDeletion() {
  cron.schedule('0 3 * * *', deletePermanentLinks)
}

export function initializeCronJobs() {
  logger.info('Initializing cron jobs...')
  scheduleMonthlyLimitReset()
  scheduleLinkDeactivation()
  scheduleLinkDeletion()
  logger.info('All cron jobs initialized successfully')
}

export async function manualMonthlyReset() {
  logger.info('Manual monthly limit reset triggered...')
  try {
    // Reset monthly limits for users using Prisma
    const userResult = await prisma.user.updateMany({
      data: {
        monthlyLinksCreated: 0,
        lastReset: new Date()
      }
    })

    // Reset custom changes for links using Prisma
    const linkResult = await prisma.link.updateMany({
      data: { customChanges: 0 }
    })

    logger.info(`Manual monthly reset completed: ${userResult.count} users and ${linkResult.count} links updated.`)
    return {
      success: true,
      usersUpdated: userResult.count,
      linksUpdated: linkResult.count
    }
  } catch (error) {
    logger.error('Manual monthly reset error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export async function manualLinkCleanup() {
  logger.info('Manual link cleanup triggered...')
  try {
    const fiveMonthsAgo = new Date()
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5)

    // Deactivate inactive links using Prisma
    const result = await prisma.link.updateMany({
      where: {
        active: true,
        OR: [
          { lastVisited: null, createdAt: { lt: fiveMonthsAgo } },
          { lastVisited: { lt: fiveMonthsAgo } }
        ]
      },
      data: {
        active: false,
        deactivatedAt: new Date()
      }
    })

    logger.info(`Manual cleanup: ${result.count} links deactivated.`)
    return {
      success: true,
      linksDeactivated: result.count
    }
  } catch (error) {
    logger.error('Manual link cleanup error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}