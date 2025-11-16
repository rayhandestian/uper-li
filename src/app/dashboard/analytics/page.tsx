import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  // Get user's links and visit statistics using raw SQL
  const linksResult = await db.query(`
    SELECT l.*,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', v.id,
                 'visitedAt', v."visitedAt",
                 'linkId', v."linkId"
               )
               ORDER BY v."visitedAt" DESC
             ) FILTER (WHERE v.id IS NOT NULL),
             '[]'::json
           ) as visits
    FROM "Link" l
    LEFT JOIN "Visit" v ON l.id = v."linkId"
    WHERE l."userId" = $1
    GROUP BY l.id
    ORDER BY l."visitCount" DESC
  `, [session.user.id])

  const links = linksResult.rows

  // Calculate total visits
  const totalVisits = links.reduce((sum: number, link: any) => sum + (parseInt(link.visitCount) || 0), 0)

  return (
    <div className="px-6 py-8 sm:px-0">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900">Analitik Link</h1>
        <p className="mt-2 text-lg text-gray-600">
          Lihat statistik kunjungan link Anda
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-12">
        <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-lg">
          <div className="p-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-medium">V</span>
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-base font-medium text-gray-500 truncate">
                    Total Kunjungan
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 mt-1">
                    {totalVisits}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-lg">
          <div className="p-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-medium">L</span>
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-base font-medium text-gray-500 truncate">
                    Jumlah Link
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 mt-1">
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
                    <p className="text-base font-medium text-blue-600 truncate">
                      uper.li/{link.shortUrl}
                    </p>
                    <p className="mt-2 text-base text-gray-500 truncate">
                      {link.longUrl}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg text-gray-900">
                      {link.visitCount} kunjungan
                    </span>
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

      <div className="mt-12">
        <h3 className="text-2xl leading-6 font-semibold text-gray-900 mb-8">
          Kunjungan Terbaru
        </h3>
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded-lg">
          <ul className="divide-y divide-gray-200">
            {/* @ts-ignore */}
            {links.flatMap(link => link.visits).sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime()).slice(0, 10).map((visit) => {
              // @ts-ignore
              const link = links.find(l => l.id === visit.linkId)
              return (
                <li key={visit.id}>
                  <div className="px-8 py-6 sm:px-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-medium text-blue-600">
                          uper.li/{link?.shortUrl}
                        </p>
                        <p className="text-base text-gray-500">
                          {new Date(visit.visitedAt).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
            {/* @ts-ignore */}
            {links.flatMap(link => link.visits).length === 0 && (
              <li>
                <div className="px-8 py-6 sm:px-8 text-center text-gray-500">
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