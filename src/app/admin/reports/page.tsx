import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export default async function AdminReportsPage() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')

  if (!adminAuth || adminAuth.value !== 'true') {
    return null
  }

  // Get detailed statistics using raw SQL
  const statsResult = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM "User") as totalUsers,
      (SELECT COUNT(*) FROM "User" WHERE active = true) as activeUsers,
      (SELECT COUNT(*) FROM "User" WHERE "twoFactorEnabled" = true) as usersWith2FA,
      (SELECT COUNT(*) FROM "Link") as totalLinks,
      (SELECT COUNT(*) FROM "Link" WHERE active = true) as activeLinks,
      (SELECT COUNT(*) FROM "Link" WHERE password IS NOT NULL) as passwordProtectedLinks,
      (SELECT SUM("visitCount") FROM "Link") as totalVisits
  `)

  const stats = statsResult.rows[0]

  // Get user role distribution using raw SQL
  const userRolesResult = await db.query(`
    SELECT role, COUNT(*) as count
    FROM "User"
    GROUP BY role
    ORDER BY count DESC
  `)

  const userRoles = userRolesResult.rows.map(row => ({
    role: row.role,
    _count: { role: parseInt(row.count) }
  }))

  // Get monthly activity (last 12 months) using raw SQL
  const now = new Date()
  const monthlyStats = []

  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

    const monthStatsResult = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM "User" WHERE "createdAt" >= $1 AND "createdAt" < $2) as usersCreated,
        (SELECT COUNT(*) FROM "Link" WHERE "createdAt" >= $1 AND "createdAt" < $2) as linksCreated,
        (SELECT COALESCE(SUM("visitCount"), 0) FROM "Link" WHERE "createdAt" >= $1 AND "createdAt" < $2) as visits
    `, [monthStart, monthEnd])

    const monthStats = monthStatsResult.rows[0]

    monthlyStats.push({
      month: monthStart.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
      users: parseInt(monthStats.usersCreated),
      links: parseInt(monthStats.linksCreated),
      visits: parseInt(monthStats.visits),
    })
  }

  // Get top users by link count using raw SQL
  const topUsersResult = await db.query(`
    SELECT "nimOrUsername", email, "totalLinks", "monthlyLinksCreated", role
    FROM "User"
    ORDER BY "totalLinks" DESC
    LIMIT 10
  `)

  const topUsers = topUsersResult.rows

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">System Reports</h1>
        <p className="mt-1 text-sm text-gray-600">
          Detailed statistics and analytics for the UPer.li system
        </p>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">👥</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Users
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalUsers}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    {stats.activeUsers} aktif
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
                  <span className="text-white text-sm font-medium">🔗</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Links
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalLinks}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    {stats.activeLinks} aktif, {stats.passwordProtectedLinks} dengan password
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
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">🛡️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Security
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.usersWith2FA}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    users dengan 2FA
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
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Visits
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalVisits}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    semua waktu
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Role Distribution */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Distribusi Peran User
          </h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {userRoles.map((role: { role: string; _count: { role: number } }) => (
              <div key={role.role} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{role._count.role}</div>
                <div className="text-sm text-gray-500">
                  {role.role === 'STUDENT' ? 'Mahasiswa' : role.role === 'STAFF' ? 'Dosen/Staff' : 'Admin'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Activity Chart */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Aktivitas Bulanan (12 bulan terakhir)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bulan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Baru
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Link Baru
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kunjungan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyStats.map((stat, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stat.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.users}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.links}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.visits}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Top 10 User berdasarkan Jumlah Link
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peran
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Link
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Link Bulan Ini
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topUsers.map((user: { nimOrUsername: string; email: string; totalLinks: number; monthlyLinksCreated: number; role: string }, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.nimOrUsername}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.role === 'STUDENT' ? 'Mahasiswa' : user.role === 'STAFF' ? 'Dosen/Staff' : 'Admin'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.totalLinks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.monthlyLinksCreated}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}