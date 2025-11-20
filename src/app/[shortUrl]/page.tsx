import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import ShortUrlClient from './ShortUrlClient'

interface LinkData {
  status: 'not_found' | 'inactive' | 'locked' | 'ok'
  longUrl?: string
  mode?: string
  id?: number
}

async function getLinkData(shortUrl: string): Promise<LinkData> {
  const linkResult = await db.query(
    'SELECT * FROM "Link" WHERE "shortUrl" = $1',
    [shortUrl]
  )

  if (linkResult.rows.length === 0) {
    return { status: 'not_found' }
  }

  const link = linkResult.rows[0]

  if (!link.active) {
    return { status: 'inactive' }
  }

  if (link.password) {
    return { status: 'locked', longUrl: link.longUrl, id: link.id }
  }

  return {
    status: 'ok',
    longUrl: link.longUrl,
    mode: link.mode,
    id: link.id
  }
}

export default async function ShortUrlPage({
  params,
}: {
  params: Promise<{ shortUrl: string }>
}) {
  const { shortUrl } = await params

  const headersList = await headers()
  const host = headersList.get('host')
  if (!host || (host !== 'uper.li' && !host.startsWith('localhost'))) {
    return <ShortUrlClient initialData={{ status: 'not_found' }} shortUrl={shortUrl} />
  }

  const data = await getLinkData(shortUrl)

  if (data.status === 'ok' && data.mode === 'DIRECT' && data.longUrl) {
    // Log visit before redirect
    if (data.id) {
      await db.query(
        'UPDATE "Link" SET "visitCount" = "visitCount" + 1, "lastVisited" = NOW() WHERE id = $1',
        [data.id]
      )
    }
    redirect(data.longUrl)
  }

  // For non-direct modes, render client component
  return <ShortUrlClient initialData={data} shortUrl={shortUrl} />
}