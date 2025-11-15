import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface PageProps {
  params: {
    shortUrl: string
  }
}

export default async function ShortUrlPage({ params }: PageProps) {
  const { shortUrl } = params

  const link = await prisma.link.findUnique({
    where: { shortUrl },
  })

  if (!link) {
    notFound()
  }

  // Log visit
  await prisma.visit.create({
    data: {
      linkId: link.id,
      // ip and userAgent can be added later with headers
    },
  })

  await prisma.link.update({
    where: { id: link.id },
    data: {
      visitCount: { increment: 1 },
      lastVisited: new Date(),
    },
  })

  if (!link.active) {
    redirect('/inactive')
  }

  // Check if link has password protection
  if (link.password) {
    redirect(`/locked/${shortUrl}?url=${encodeURIComponent(link.longUrl)}`)
  }

  if (link.mode === 'DIRECT') {
    redirect(link.longUrl)
  }

  // Preview mode
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            UPer.li
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Anda akan diarahkan ke:
          </p>
          <p className="text-sm text-gray-500 mb-8 break-all">
            {link.longUrl}
          </p>
          <a
            href={link.longUrl}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Lanjutkan ke Tujuan
          </a>
        </div>
      </div>
    </div>
  )
}