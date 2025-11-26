import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import ShortUrlClient from './ShortUrlClient'

interface LinkData {
  status: 'not_found' | 'inactive' | 'locked' | 'ok'
  longUrl?: string
  mode?: string
  id?: string
}

async function getLinkData(shortUrl: string): Promise<LinkData> {
  const link = await prisma.link.findUnique({
    where: { shortUrl }
  })

  if (!link) {
    return { status: 'not_found' }
  }

  if (!link.active) {
    return { status: 'inactive' }
  }

  if (link.password) {
    return { status: 'locked', longUrl: link.longUrl, id: link.id }
  }

  return {
    status: 'ok',
    longUrl: link.longUrl,
    mode: link.mode || undefined,
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
    notFound()
  }

  const data = await getLinkData(shortUrl)

  if (data.status === 'ok' && data.mode === 'DIRECT' && data.longUrl) {
    // Log visit before redirect
    if (data.id) {
      await prisma.link.update({
        where: { id: data.id },
        data: {
          visitCount: { increment: 1 },
          lastVisited: new Date()
        }
      })
    }
    redirect(data.longUrl)
  }

  // For non-direct modes, render client component
  return <ShortUrlClient initialData={data} shortUrl={shortUrl} />
}