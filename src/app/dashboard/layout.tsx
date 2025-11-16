import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-base leading-5 font-semibold rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                  UPer.li
                </Link>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-10">
                <Link href="/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-base font-medium transition-colors">
                  Beranda
                </Link>
                <Link href="/dashboard/links" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-base font-medium transition-colors">
                  Link
                </Link>
                <Link href="/dashboard/analytics" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-base font-medium transition-colors">
                  Analitik
                </Link>
                <Link href="/dashboard/qr" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-base font-medium transition-colors">
                  QR Code
                </Link>
                <Link href="/dashboard/account" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-base font-medium transition-colors">
                  Akun
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-base text-gray-700 mr-6">
                {session.user?.email}
              </span>
              <LogoutButton className="text-blue-600 hover:text-blue-500 text-base" />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 sm:px-8 lg:px-8">
        {children}
      </main>
    </div>
  )
}