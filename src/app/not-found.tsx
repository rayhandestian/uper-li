import Link from 'next/link'
import Footer from '@/components/Footer'

export default function NotFound() {
  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Beranda
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center">
              <div className="mb-8">
                <div className="mx-auto w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Halaman Tidak Ditemukan
                </h2>
                <p className="text-base text-gray-600">
                  URL yang Anda cari tidak tersedia.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-base text-gray-500">
                  Kemungkinan penyebab:
                </p>
                <ul className="text-base text-gray-500 text-left space-y-1">
                  <li>• Halaman sudah dihapus atau dipindahkan</li>
                  <li>• URL yang Anda masukkan salah</li>
                  <li>• Link sudah kedaluwarsa</li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href="/"
                  className="w-full flex justify-center items-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl min-h-[52px]"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}