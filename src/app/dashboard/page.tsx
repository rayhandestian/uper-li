import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  // Get user data and links using raw SQL
  const userResult = await db.query(`
    SELECT u.*,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', l.id,
                 'shortUrl', l."shortUrl",
                 'longUrl', l."longUrl",
                 'active', l.active,
                 'createdAt', l."createdAt"
               )
               ORDER BY l."createdAt" DESC
             ) FILTER (WHERE l.id IS NOT NULL),
             '[]'::json
           ) as links
    FROM "User" u
    LEFT JOIN "Link" l ON u.id = l."userId"
    WHERE u.id = $1
    GROUP BY u.id
  `, [session.user.id])

  if (userResult.rows.length === 0) {
    return null
  }

  const user = userResult.rows[0]

  const totalLinks = user.totalLinks
  const monthlyLinks = user.monthlyLinksCreated
  const maxMonthly = user.role === 'STUDENT' ? 5 : 10

  return (
    <div className="px-6 py-8 sm:px-0">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900">Beranda Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">
          Selamat datang, {user.nimOrUsername}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-lg">
          <div className="p-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-medium">L</span>
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-base font-medium text-gray-500 truncate">
                    Total Link
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 mt-1">
                    {totalLinks}
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
                  <span className="text-white text-lg font-medium">M</span>
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-base font-medium text-gray-500 truncate">
                    Link Bulan Ini
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 mt-1">
                    {monthlyLinks} / {maxMonthly}
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
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-medium">R</span>
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-base font-medium text-gray-500 truncate">
                    Peran
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 mt-1">
                    {user.role === 'STUDENT' ? 'Mahasiswa' : 'Dosen/Staff'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">Link Terbaru</h2>
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded-lg">
          <ul className="divide-y divide-gray-200">
            {/* @ts-ignore */}
            {user.links.map((link) => (
              <li key={link.id}>
                <div className="px-6 py-6 sm:px-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-base font-medium text-blue-600 truncate">
                        uper.li/{link.shortUrl}
                      </p>
                      <p className="ml-3 text-base text-gray-500 truncate">
                        → {link.longUrl}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        link.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {link.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {user.links.length === 0 && (
              <li>
                <div className="px-6 py-6 sm:px-8 text-center text-gray-500">
                  Belum ada link yang dibuat.
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}