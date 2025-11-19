import Footer from '@/components/Footer'
import LogoutButton from '@/components/LogoutButton'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function Home() {
  const session = await getServerSession(authOptions)
  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="text-center max-w-4xl mx-auto fade-in">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            UPer.li
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            URL Shortener Eksklusif untuk Civitas Universitas Pertamina
          </p>
          {session ? (
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link
                href="/dashboard"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 min-h-[52px] w-full sm:w-auto"
              >
                <span>Dashboard</span>
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <LogoutButton className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-red-600 bg-white rounded-xl hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-md hover:shadow-lg border-2 border-red-200 hover:border-red-300 min-h-[52px] w-full sm:w-auto" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link
                href="/register"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 min-h-[52px] w-full sm:w-auto"
              >
                <span>Daftar</span>
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-gray-700 bg-white rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg border-2 border-gray-200 hover:border-gray-300 min-h-[52px] w-full sm:w-auto"
              >
                Masuk
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
