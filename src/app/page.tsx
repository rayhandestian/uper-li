import Footer from '@/components/Footer'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function Home() {
  const session = await getServerSession(authOptions)
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-grow flex flex-col items-center justify-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          UPer.li
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md text-center">
          URL Shortener Eksklusif untuk Civitas Universitas Pertamina
        </p>
        {session ? (
          <div className="space-x-4 flex items-center">
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Dashboard
            </Link>
            <a
              href="/api/auth/signout"
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Keluar
            </a>
          </div>
        ) : (
          <div className="space-x-4">
            <Link
              href="/register"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Daftar
            </Link>
            <Link
              href="/login"
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition"
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
