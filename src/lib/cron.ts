/* eslint-disable @typescript-eslint/no-unused-vars */
import cron from 'node-cron'
import { db } from './db'
import { sendEmail } from './email'

interface Link {
  id: string
  createdAt: Date
  lastVisited: Date | null
  email: string
  nimOrUsername: string
  shortUrl: string
  longUrl: string
}

// Monthly limit reset - runs on the 1st of every month at 00:00
export function scheduleMonthlyLimitReset() {
  cron.schedule('0 0 1 * *', async () => {
    console.log('Running monthly limit reset...')

    try {
      // Reset monthly link counts for all users
      const result = await db.query(`
        UPDATE "User"
        SET "monthlyLinksCreated" = 0, "lastReset" = NOW()
      `)

      console.log(`Monthly limit reset completed.`)

      // Log the reset operation
      await db.query(`
        INSERT INTO system_logs (action, details, created_at)
        VALUES ('monthly_reset', $1, NOW())
      `, [JSON.stringify({})])

    } catch (error) {
      console.error('Error during monthly limit reset:', error)

      // Log the error
      await db.query(`
        INSERT INTO system_logs (action, details, created_at)
        VALUES ('monthly_reset_error', $1, NOW())
      `, [JSON.stringify({ error: error instanceof Error ? error.message : String(error) })])
    }
  })
}

// Link deactivation check - runs daily at 02:00
export function scheduleLinkDeactivation() {
  cron.schedule('0 2 * * *', async () => {
    console.log('Running link deactivation check...')

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
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 4) // 4 months since creation = 1 month before 5-month mark

        const linksForWarning = linksToDeactivate.filter((link: Link) => {
          const createdAt = new Date(link.createdAt)
          const lastVisited = link.lastVisited ? new Date(link.lastVisited) : null

          return createdAt <= oneMonthAgo &&
            (!lastVisited || lastVisited <= oneMonthAgo)
        })

        // Send warning emails
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
                <p><strong>${link.longUrl}</strong></p>
                <p>Silakan kunjungi link tersebut atau aktifkan kembali di dashboard Anda untuk memperpanjang masa aktif.</p>
                <p>Jika tidak diaktifkan dalam 1 bulan, link akan dihapus secara permanen.</p>
                <p>Salam,<br>Tim UPer.li</p>
              `,
            })
          } catch (emailError) {
            console.error(`Failed to send warning email for link ${link.shortUrl}:`, emailError)
          }
        }

        // Deactivate links that are exactly 5 months old
        const linksToDeactivateNow = linksToDeactivate.filter((link: Link) => {
          const createdAt = new Date(link.createdAt)
          const lastVisited = link.lastVisited ? new Date(link.lastVisited) : null

          return createdAt <= fiveMonthsAgo &&
            (!lastVisited || lastVisited <= fiveMonthsAgo)
        })

        if (linksToDeactivateNow.length > 0) {
          const linkIds = linksToDeactivateNow.map((link: Link) => link.id)

          const result = await db.query(`
            UPDATE "Link"
            SET active = false, "deactivatedAt" = NOW()
            WHERE id = ANY($1)
          `, [linkIds])

          console.log(`Deactivated ${result.rowCount} links due to inactivity.`)

          // Log deactivation
          await db.query(`
            INSERT INTO system_logs (action, details, created_at)
            VALUES ('link_deactivation', $1, NOW())
          `, [JSON.stringify({
            linksDeactivated: result.rowCount,
            warningsSent: linksForWarning.length
          })])
        }
      }

    } catch (error) {
      console.error('Error during link deactivation check:', error)

      // Log the error
      try {
        await db.query(`
          INSERT INTO system_logs (action, details, created_at)
          VALUES ('link_deactivation_error', $1, NOW())
        `, [JSON.stringify({ error: error instanceof Error ? error.message : String(error) })])
      } catch (logError) {
        console.error('Failed to log deactivation error:', logError)
      }
    }
  })
}

// Permanent link deletion - runs daily at 03:00 (1 month after deactivation)
export function scheduleLinkDeletion() {
  cron.schedule('0 3 * * *', async () => {
    console.log('Running permanent link deletion check...')

    try {
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

      // Find deactivated links that have been inactive for 1 month
      const linksToDeleteResult = await db.query(`
        SELECT id FROM "Link"
        WHERE active = false AND "deactivatedAt" < $1
      `, [oneMonthAgo])

      const linksToDelete = linksToDeleteResult.rows

      if (linksToDelete.length > 0) {
        const linkIds = linksToDelete.map((link: Link) => link.id)

        // Delete the links (cascade will handle visits)
        const result = await db.query(`
          DELETE FROM "Link" WHERE id = ANY($1)
        `, [linkIds])

        console.log(`Permanently deleted ${result.rowCount} inactive links.`)

        // Log deletion
        await db.query(`
          INSERT INTO system_logs (action, details, created_at)
          VALUES ('link_deletion', $1, NOW())
        `, [JSON.stringify({ linksDeleted: result.rowCount })])
      }

    } catch (error) {
      console.error('Error during permanent link deletion:', error)

      // Log the error
      try {
        await db.query(`
          INSERT INTO system_logs (action, details, created_at)
          VALUES ('link_deletion_error', $1, NOW())
        `, [JSON.stringify({ error: error instanceof Error ? error.message : String(error) })])
      } catch (logError) {
        console.error('Failed to log deletion error:', logError)
      }
    }
  })
}

// Initialize all cron jobs
export function initializeCronJobs() {
  console.log('Initializing cron jobs...')

  scheduleMonthlyLimitReset()
  scheduleLinkDeactivation()
  scheduleLinkDeletion()

  console.log('All cron jobs initialized successfully')
}

// Manual execution functions for testing/admin purposes
export async function manualMonthlyReset() {
  console.log('Manual monthly limit reset triggered...')

  try {
    // Reset monthly link counts for all users
    const userResult = await db.query(`
      UPDATE "User"
      SET "monthlyLinksCreated" = 0, "lastReset" = NOW()
    `)

    // Reset custom URL change counts for all links
    const linkResult = await db.query(`
      UPDATE "Link"
      SET "customChanges" = 0
    `)

    console.log(`Manual monthly reset completed: ${userResult.rowCount} users and ${linkResult.rowCount} links updated.`)
    return { success: true, usersUpdated: userResult.rowCount || 0, linksUpdated: linkResult.rowCount || 0 }
  } catch (error) {
    console.error('Manual monthly reset error:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function manualLinkCleanup() {
  console.log('Manual link cleanup triggered...')

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

    console.log(`Manual cleanup: ${result.rowCount} links deactivated.`)
    return { success: true, linksDeactivated: result.rowCount }
  } catch (error) {
    console.error('Manual link cleanup error:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}