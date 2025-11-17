import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import ShortUrlActions from '@/components/ShortUrlActions'

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

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analitik Link</h1>
        <p className="mt-2 text-base sm:text-lg text-gray-600">
          Lihat statistik kunjungan link Anda
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8 sm:mb-12">
        <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-lg">
          <div className="p-6 sm:p-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-base sm:text-lg font-medium">V</span>
                </div>
              </div>
              <div className="ml-4 sm:ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-sm sm:text-base font-medium text-gray-500 truncate">
                    Total Kunjungan
                  </dt>
                  <dd className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1">
                    {totalVisits}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-lg">
          <div className="p-6 sm:p-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-base sm:text-lg font-medium">L</span>
                </div>
              </div>
              <div className="ml-4 sm:ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-sm sm:text-base font-medium text-gray-500 truncate">
                    Jumlah Link
                  </dt>
                  <dd className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1">
                    {links.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded-lg">
        <div className="px-8 py-8 sm:px-8">
          <h3 className="text-2xl leading-6 font-semibold text-gray-900">
            Link Terpopuler
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {/* @ts-ignore */}
          {links.map((link) => (
            <li key={link.id}>
              <div className="px-8 py-6 sm:px-8">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <ShortUrlActions shortUrl={link.shortUrl} />
                    <p className="mt-2 text-base text-gray-500 truncate">
                      {link.longUrl}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg text-gray-900">
                      {link.visitCount} kunjungan
                    </span>
                    {link.lastVisited && (
                      <span className="text-sm text-gray-500 mt-1">
                        Terakhir: {new Date(link.lastVisited).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
          {links.length === 0 && (
            <li>
              <div className="px-8 py-6 sm:px-8 text-center text-gray-500">
                Belum ada link yang dibuat.
              </div>
            </li>
          )}
        </ul>
      </div>

    </div>
  )
}