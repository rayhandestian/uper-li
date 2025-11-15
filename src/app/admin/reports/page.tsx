import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function AdminReportsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return null
  }

  // Get detailed statistics
  const totalUsers = await prisma.user.count()
  const activeUsers = await prisma.user.count({ where: { active: true } })
  const usersWith2FA = await prisma.user.count({ where: { twoFactorEnabled: true } })

  const totalLinks = await prisma.link.count()
  const activeLinks = await prisma.link.count({ where: { active: true } })
  const passwordProtectedLinks = await prisma.link.count({ where: { password: { not: null } } })

  const totalVisits = await prisma.visit.count()

  // Get user role distribution
  const userRoles = await prisma.user.groupBy({
    by: ['role'],
    _count: { role: true },
  })

  // Get monthly activity (last 12 months)
  const now = new Date()
  const monthlyStats = []

  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

    const usersCreated = await prisma.user.count({
      where: {
        createdAt: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
    })

    const linksCreated = await prisma.link.count({
      where: {
        createdAt: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
    })

    const visits = await prisma.visit.count({
      where: {
        visitedAt: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
    })

    monthlyStats.push({
      month: monthStart.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
      users: usersCreated,
      links: linksCreated,
      visits: visits,
    })
  }

  // Get top users by link count
  const topUsers = await prisma.user.findMany({
    take: 10,
    orderBy: { totalLinks: 'desc' },
    select: {
      nimOrUsername: true,
      email: true,
      totalLinks: true,
      monthlyLinksCreated: true,
      role: true,
    },
  })

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
                    {totalUsers}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    {activeUsers} aktif
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
                    {totalLinks}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    {activeLinks} aktif, {passwordProtectedLinks} dengan password
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
                    {usersWith2FA}
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
                    {totalVisits}
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