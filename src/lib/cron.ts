import cron from 'node-cron'
import { prisma } from './prisma'
import { sendEmail } from './email'

// Monthly limit reset - runs on the 1st of every month at 00:00
export function scheduleMonthlyLimitReset() {
  cron.schedule('0 0 1 * *', async () => {
    console.log('Running monthly limit reset...')

    try {
      // Reset monthly link counts for all users
      const result = await prisma.user.updateMany({
        data: {
          monthlyLinksCreated: 0,
          lastReset: new Date(),
        },
      })

      console.log(`Monthly limit reset completed. ${result.count} users updated.`)

      // Log the reset operation
      await prisma.$executeRaw`
        INSERT INTO system_logs (action, details, created_at)
        VALUES ('monthly_reset', ${JSON.stringify({ usersUpdated: result.count })}, NOW())
      `

    } catch (error) {
      console.error('Error during monthly limit reset:', error)

      // Log the error
      await prisma.$executeRaw`
        INSERT INTO system_logs (action, details, created_at)
        VALUES ('monthly_reset_error', ${JSON.stringify({ error: error instanceof Error ? error.message : String(error) })}, NOW())
      `
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
      const linksToDeactivate = await prisma.link.findMany({
        where: {
          active: true,
          OR: [
            { lastVisited: { lt: fiveMonthsAgo } },
            { lastVisited: null } // Links never visited
          ],
          createdAt: { lt: fiveMonthsAgo } // At least 5 months old
        },
        include: {
          user: {
            select: { email: true, nimOrUsername: true }
          }
        }
      })

      if (linksToDeactivate.length > 0) {
        // Send warning emails 1 month before deactivation
        const oneMonthAgo = new Date()
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 4) // 4 months since creation = 1 month before 5-month mark

        const linksForWarning = linksToDeactivate.filter((link: typeof linksToDeactivate[0]) =>
          link.createdAt <= oneMonthAgo &&
          (!link.lastVisited || link.lastVisited <= oneMonthAgo)
        )

        // Send warning emails
        for (const link of linksForWarning as typeof linksToDeactivate) {
          try {
            await sendEmail({
              to: link.user.email,
              from: 'noreply@uper.li',
              subject: 'Pemberitahuan: Link Akan Dinonaktifkan - UPer.li',
              html: `
                <p>Halo ${link.user.nimOrUsername},</p>
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
        const linksToDeactivateNow = linksToDeactivate.filter((link: typeof linksToDeactivate[0]) =>
          link.createdAt <= fiveMonthsAgo &&
          (!link.lastVisited || link.lastVisited <= fiveMonthsAgo)
        )

        if (linksToDeactivateNow.length > 0) {
          const result = await prisma.link.updateMany({
            where: {
              id: { in: linksToDeactivateNow.map((link: typeof linksToDeactivateNow[0]) => link.id) }
            },
            data: {
              active: false,
              deactivatedAt: new Date(),
            }
          })

          console.log(`Deactivated ${result.count} links due to inactivity.`)

          // Log deactivation
          await prisma.$executeRaw`
            INSERT INTO system_logs (action, details, created_at)
            VALUES ('link_deactivation', ${JSON.stringify({
              linksDeactivated: result.count,
              warningsSent: linksForWarning.length
            })}, NOW())
          `
        }
      }

    } catch (error) {
      console.error('Error during link deactivation check:', error)

      // Log the error
      try {
        await prisma.$executeRaw`
          INSERT INTO system_logs (action, details, created_at)
          VALUES ('link_deactivation_error', ${JSON.stringify({ error: error instanceof Error ? error.message : String(error) })}, NOW())
        `
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
      const linksToDelete = await prisma.link.findMany({
        where: {
          active: false,
          deactivatedAt: { lt: oneMonthAgo }
        }
      })

      if (linksToDelete.length > 0) {
        // Delete the links (cascade will handle visits)
        const result = await prisma.link.deleteMany({
          where: {
            id: { in: linksToDelete.map((link: typeof linksToDelete[0]) => link.id) }
          }
        })

        console.log(`Permanently deleted ${result.count} inactive links.`)

        // Log deletion
        await prisma.$executeRaw`
          INSERT INTO system_logs (action, details, created_at)
          VALUES ('link_deletion', ${JSON.stringify({ linksDeleted: result.count })}, NOW())
        `
      }

    } catch (error) {
      console.error('Error during permanent link deletion:', error)

      // Log the error
      try {
        await prisma.$executeRaw`
          INSERT INTO system_logs (action, details, created_at)
          VALUES ('link_deletion_error', ${JSON.stringify({ error: error instanceof Error ? error.message : String(error) })}, NOW())
        `
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
    const result = await prisma.user.updateMany({
      data: {
        monthlyLinksCreated: 0,
        lastReset: new Date(),
      },
    })

    console.log(`Manual monthly reset: ${result.count} users updated.`)
    return { success: true, usersUpdated: result.count }
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

    const result = await prisma.link.updateMany({
      where: {
        active: true,
        OR: [
          { lastVisited: { lt: fiveMonthsAgo } },
          { lastVisited: null }
        ],
        createdAt: { lt: fiveMonthsAgo }
      },
      data: {
        active: false,
        deactivatedAt: new Date(),
      }
    })

    console.log(`Manual cleanup: ${result.count} links deactivated.`)
    return { success: true, linksDeactivated: result.count }
  } catch (error) {
    console.error('Manual link cleanup error:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}