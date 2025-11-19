import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import ShortUrlActions from '@/components/ShortUrlActions'

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
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Beranda Dashboard</h1>
        <p className="mt-3 text-lg text-gray-600">
          Selamat datang, <span className="font-semibold">{user.nimOrUsername}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
        {/* Total Links Card */}
        <div className="group bg-white overflow-hidden shadow-md hover:shadow-xl border border-gray-200 rounded-2xl transition-all duration-200">
          <div className="p-6 sm:p-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
              </div>
              <div className="ml-6 flex-1">
                <dt className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Total Link
                </dt>
                <dd className="text-3xl font-bold text-gray-900 mt-1">
                  {totalLinks}
                </dd>              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 px-6 py-3">
            <p className="text-xs text-blue-700 font-medium">Semua link yang dibuat</p>
          </div>
        </div>

        {/* Monthly Links Card */}
        <div className="group bg-white overflow-hidden shadow-md hover:shadow-xl border border-gray-200 rounded-2xl transition-all duration-200">
          <div className="p-6 sm:p-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-6 flex-1">
                <dt className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Link Bulan Ini
                </dt>
                <dd className="text-3xl font-bold text-gray-900 mt-1">
                  {monthlyLinks} / {maxMonthly}
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100/50 px-6 py-3">
            <p className="text-xs text-green-700 font-medium">Kuota bulanan tersisa: {maxMonthly - monthlyLinks}</p>
          </div>
        </div>

        {/* Role Card */}
        <div className="group bg-white overflow-hidden shadow-md hover:shadow-xl border border-gray-200 rounded-2xl transition-all duration-200">
          <div className="p-6 sm:p-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-6 flex-1">
                <dt className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Peran
                </dt>
                <dd className="text-2xl font-bold text-gray-900 mt-1">
                  {user.role === 'STUDENT' ? 'Mahasiswa' : 'Dosen/Staff'}
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 px-6 py-3">
            <p className="text-xs text-purple-700 font-medium">Status akun Anda</p>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Link Terbaru</h2>
        </div>
        <div className="bg-white shadow-md border border-gray-200 overflow-hidden rounded-2xl">
          <ul className="divide-y divide-gray-100">
            {/* @ts-expect-error: TypeScript cannot infer the type of user.links from the raw SQL query */}
            {user.links.map((link) => (
              <li key={link.id} className="hover:bg-gray-50 transition-colors duration-150">
                <div className="px-6 py-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <ShortUrlActions shortUrl={link.shortUrl} />
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${link.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {link.active ? '✓ Aktif' : '✕ Nonaktif'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 break-all flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        {link.longUrl}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {user.links.length === 0 && (
              <li>
                <div className="px-8 py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <p className="mt-4 text-base text-gray-600 font-medium">Belum ada link yang dibuat</p>
                  <p className="mt-2 text-sm text-gray-500">Buat link pertama Anda untuk memulai</p>
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}