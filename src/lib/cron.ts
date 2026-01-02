import cron from 'node-cron'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

export const resetMonthlyLimits = async () => {
  logger.info('Running monthly limit reset...')
  try {
    // Reset monthly limits for users
    const userResult = await prisma.user.updateMany({
      data: {
        monthlyLinksCreated: 0,
        lastReset: new Date()
      }
    })

    // Reset custom changes for links
    const linkResult = await prisma.link.updateMany({
      data: { customChanges: 0 }
    })

    logger.info(`Monthly limit reset completed: ${userResult.count} users and ${linkResult.count} links updated.`)
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

    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 4)

    const BATCH_SIZE = 100
    let skip = 0
    let hasMore = true

    while (hasMore) {
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
          User: {
            select: {
              email: true,
              nimOrUsername: true
            }
          }
        },
        take: BATCH_SIZE,
        skip: skip
      })

      if (linksToDeactivate.length === 0) {
        break
      }

      // Process batch
      const linksForWarning = linksToDeactivate.filter((link) => {
        const createdAt = link.createdAt
        const lastVisited = link.lastVisited
        return createdAt && createdAt <= oneMonthAgo && (!lastVisited || lastVisited <= oneMonthAgo)
      })

      for (const link of linksForWarning) {
        try {
          await sendEmail({
            to: link.User.email,
            from: 'noreply@uper.li',
            subject: 'Pemberitahuan: Link Akan Dinonaktifkan - UPer.li',
            html: `
                            <p>Halo ${link.User.nimOrUsername},</p>
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

        logger.info(`Deactivated ${result.count} links due to inactivity (batch).`)
      }

      // If we processed fewer than BATCH_SIZE, we're done
      if (linksToDeactivate.length < BATCH_SIZE) {
        hasMore = false
      } else {
        // Increment skip to process next batch
        skip += BATCH_SIZE
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

export const deleteUnverifiedUsers = async () => {
  logger.info('Running unverified user cleanup check...')
  try {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    // Delete unverified users older than 3 days
    const result = await prisma.user.deleteMany({
      where: {
        emailVerified: null,
        createdAt: { lt: threeDaysAgo }
      }
    })

    logger.info(`Deleted ${result.count} unverified users older than 3 days.`)
    return result.count
  } catch (error) {
    logger.error('Unverified user cleanup error:', error)
    return 0
  }
}

export function scheduleUnverifiedUserCleanup() {
  cron.schedule('0 4 * * *', deleteUnverifiedUsers)
}

export const revalidateStoredUrls = async () => {
  logger.info('Running URL re-validation check...')
  try {
    const { checkUrlSafety } = await import('@/lib/safeBrowsing')

    const BATCH_SIZE = 50 // Process 50 links at a time to avoid overwhelming the API
    let skip = 0
    let hasMore = true
    let totalDeactivated = 0

    while (hasMore) {
      // Find active links to check
      const linksToCheck = await prisma.link.findMany({
        where: {
          active: true
        },
        select: {
          id: true,
          shortUrl: true,
          longUrl: true
        },
        take: BATCH_SIZE,
        skip: skip
      })

      if (linksToCheck.length === 0) {
        break
      }

      // Check each link against Safe Browsing API
      for (const link of linksToCheck) {
        try {
          const isSafe = await checkUrlSafety(link.longUrl)

          if (!isSafe) {
            // Deactivate malicious link
            await prisma.link.update({
              where: { id: link.id },
              data: {
                active: false,
                deactivatedAt: new Date()
              }
            })
            totalDeactivated++
            logger.warn(`Deactivated malicious link: ${link.shortUrl} -> ${link.longUrl}`)
          }

          // Add small delay to avoid hitting API rate limits
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          logger.error(`Error checking link ${link.shortUrl}:`, error)
          // Continue with next link instead of stopping
        }
      }

      // If we processed fewer than BATCH_SIZE, we're done
      if (linksToCheck.length < BATCH_SIZE) {
        hasMore = false
      } else {
        skip += BATCH_SIZE
      }
    }

    logger.info(`URL re-validation completed: ${totalDeactivated} malicious links deactivated`)
  } catch (error) {
    logger.error('URL re-validation error:', error)
  }
}

export function scheduleUrlRevalidation() {
  cron.schedule('0 1 * * *', revalidateStoredUrls) // Run daily at 1 AM
}

export function initializeCronJobs() {
  logger.info('Initializing cron jobs...')
  scheduleMonthlyLimitReset()
  scheduleLinkDeactivation()
  scheduleLinkDeletion()
  scheduleUnverifiedUserCleanup()
  scheduleUrlRevalidation()
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