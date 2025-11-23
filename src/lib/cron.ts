import cron from 'node-cron'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

interface Link {
  id: string
  shortUrl: string
  longUrl: string
  userId: string
  active: boolean
  createdAt: Date
  lastVisited: Date | null
  email: string
  nimOrUsername: string
}

export const resetMonthlyLimits = async () => {
  logger.info('Running monthly limit reset...')
  try {
    // Reset monthlyLinksCreated for all users
    await db.query('UPDATE "User" SET "monthlyLinksCreated" = 0')

    // Log the reset
    await db.query(
      'INSERT INTO system_logs (level, message, metadata) VALUES ($1, $2, $3)',
      ['info', 'Monthly limit reset executed', JSON.stringify({ timestamp: new Date() })]
    )

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

    // Find links that haven't been visited in 5 months and are still active
    const linksToDeactivateResult = await db.query(`
            SELECT l.*, u.email, u."nimOrUsername"
            FROM "Link" l
            JOIN "User" u ON l."userId" = u.id
            WHERE l.active = true
            AND (l."lastVisited" IS NULL OR l."lastVisited" < $1)
            AND l."createdAt" < $1
        `, [fiveMonthsAgo])

    const linksToDeactivate = linksToDeactivateResult.rows

    if (linksToDeactivate.length > 0) {
      // Send warning emails 1 month before deactivation
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 4)

      const linksForWarning = linksToDeactivate.filter((link: Link) => {
        const createdAt = new Date(link.createdAt)
        const lastVisited = link.lastVisited ? new Date(link.lastVisited) : null
        return createdAt <= oneMonthAgo && (!lastVisited || lastVisited <= oneMonthAgo)
      })

      for (const link of linksForWarning) {
        try {
          await sendEmail({
            to: link.email,
            from: 'noreply@uper.li',
            subject: 'Pemberitahuan: Link Akan Dinonaktifkan - UPer.li',
            html: `
                            <p>Halo ${link.nimOrUsername},</p>
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
      const linksToDeactivateNow = linksToDeactivate.filter((link: Link) => {
        const createdAt = new Date(link.createdAt)
        const lastVisited = link.lastVisited ? new Date(link.lastVisited) : null
        return createdAt <= fiveMonthsAgo && (!lastVisited || lastVisited <= fiveMonthsAgo)
      })

      if (linksToDeactivateNow.length > 0) {
        const linkIds = linksToDeactivateNow.map((link: Link) => link.id)
        const result = await db.query(`
                    UPDATE "Link"
                    SET active = false, "deactivatedAt" = NOW()
                    WHERE id = ANY($1)
                `, [linkIds])
        logger.info(`Deactivated ${result.rowCount} links due to inactivity.`)
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

    const linksToDeleteResult = await db.query(`
            SELECT id FROM "Link"
            WHERE active = false AND "deactivatedAt" < $1
        `, [oneMonthAgo])

    const linksToDelete = linksToDeleteResult.rows

    if (linksToDelete.length > 0) {
      const linkIds = linksToDelete.map((link: Link) => link.id)
      const result = await db.query('DELETE FROM "Link" WHERE id = ANY($1)', [linkIds])
      logger.info(`Permanently deleted ${result.rowCount} inactive links.`)
    }
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
    const userResult = await db.query('UPDATE "User" SET "monthlyLinksCreated" = 0, "lastReset" = NOW()')
    const linkResult = await db.query('UPDATE "Link" SET "customChanges" = 0')
    logger.info(`Manual monthly reset completed: ${userResult.rowCount} users and ${linkResult.rowCount} links updated.`)
    return { success: true, usersUpdated: userResult.rowCount || 0, linksUpdated: linkResult.rowCount || 0 }
  } catch (error) {
    logger.error('Manual monthly reset error:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function manualLinkCleanup() {
  logger.info('Manual link cleanup triggered...')
  try {
    const fiveMonthsAgo = new Date()
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5)
    const result = await db.query(`
            UPDATE "Link"
            SET active = false, "deactivatedAt" = NOW()
            WHERE active = true
            AND ("lastVisited" IS NULL OR "lastVisited" < $1)
            AND "createdAt" < $1
        `, [fiveMonthsAgo])
    logger.info(`Manual cleanup: ${result.rowCount} links deactivated.`)
    return { success: true, linksDeactivated: result.rowCount }
  } catch (error) {
    logger.error('Manual link cleanup error:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}