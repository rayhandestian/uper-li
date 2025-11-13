import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function AccountPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    return null
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Akun</h1>
        <p className="mt-1 text-sm text-gray-600">
          Kelola informasi akun Anda
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Informasi Akun
          </h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Peran</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.role === 'STUDENT' ? 'Mahasiswa' : 'Dosen/Staff'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">NIM/Username</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.nimOrUsername}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status Verifikasi</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.emailVerified ? 'Terverifikasi' : 'Belum Terverifikasi'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Link Bulan Ini</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.monthlyLinksCreated} / {user.role === 'STUDENT' ? 5 : 10}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Link</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.totalLinks} / {user.role === 'STUDENT' ? 100 : 200}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}