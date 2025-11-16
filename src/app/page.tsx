import Footer from '@/components/Footer'
import LogoutButton from '@/components/LogoutButton'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function Home() {
  const session = await getServerSession(authOptions)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow flex flex-col items-center justify-center px-6">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          UPer.li
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-lg text-center leading-relaxed">
          URL Shortener Eksklusif untuk Civitas Universitas Pertamina
        </p>
        {session ? (
          <div className="space-x-6 flex items-center">
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-base font-medium transition-colors shadow-sm"
            >
              Dashboard
            </Link>
            <LogoutButton className="bg-white text-red-600 px-6 py-3 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 text-base font-medium transition-colors shadow-sm border border-red-300" />
          </div>
        ) : (
          <div className="space-x-6">
            <Link
              href="/register"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-base font-medium transition-colors shadow-sm"
            >
              Daftar
            </Link>
            <Link
              href="/login"
              className="bg-white text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-base font-medium transition-colors shadow-sm border border-gray-300"
            >
              Masuk
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
