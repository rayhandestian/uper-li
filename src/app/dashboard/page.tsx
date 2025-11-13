import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      links: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!user) {
    return null
  }

  const totalLinks = user.totalLinks
  const monthlyLinks = user.monthlyLinksCreated
  const maxMonthly = user.role === 'STUDENT' ? 5 : 10

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Beranda Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Selamat datang, {user.name || user.nimOrUsername}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">L</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Link
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalLinks}
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
                  <span className="text-white text-sm font-medium">M</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Link Bulan Ini
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {monthlyLinks} / {maxMonthly}
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
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">R</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Peran
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {user.role === 'STUDENT' ? 'Mahasiswa' : 'Dosen/Staff'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Link Terbaru</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {/* @ts-ignore */}
            {user.links.map((link) => (
              <li key={link.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        uper.link/{link.shortUrl}
                      </p>
                      <p className="ml-2 text-sm text-gray-500 truncate">
                        → {link.longUrl}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
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