import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const links = await prisma.link.findMany({
    where: { userId: session.user.id },
    include: {
      visits: {
        orderBy: { visitedAt: 'desc' },
        take: 10,
      },
    },
    orderBy: { visitCount: 'desc' },
  })

  const totalVisits = links.reduce((sum, link) => sum + link.visitCount, 0)

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analitik Link</h1>
        <p className="mt-1 text-sm text-gray-600">
          Lihat statistik kunjungan link Anda
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">V</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Kunjungan
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalVisits}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">L</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Jumlah Link
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {links.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Link Terpopuler
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {links.map((link) => (
            <li key={link.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-600 truncate">
                      uper.link/{link.shortUrl}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {link.longUrl}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-900">
                      {link.visitCount} kunjungan
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {links.length === 0 && (
            <li>
              <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                Belum ada link yang dibuat.
              </div>
            </li>
          )}
        </ul>
      </div>

      <div className="mt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Kunjungan Terbaru
        </h3>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {links.flatMap(link => link.visits).sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime()).slice(0, 10).map((visit) => {
              const link = links.find(l => l.id === visit.linkId)
              return (
                <li key={visit.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">
                          uper.link/{link?.shortUrl}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(visit.visitedAt).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
            {links.flatMap(link => link.visits).length === 0 && (
              <li>
                <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  Belum ada kunjungan.
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}