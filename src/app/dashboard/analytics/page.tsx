import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import AnalyticsContent from '@/components/AnalyticsContent'

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  // Get user's links using raw SQL
  const linksResult = await db.query(`
    SELECT * FROM "Link" WHERE "userId" = $1 ORDER BY "visitCount" DESC
  `, [session.user.id])

  const links = linksResult.rows

  // Calculate total visits
  const totalVisits = links.reduce((sum: number, link: any) => sum + (parseInt(link.visitCount) || 0), 0)

  return <AnalyticsContent links={links} totalVisits={totalVisits} />
}