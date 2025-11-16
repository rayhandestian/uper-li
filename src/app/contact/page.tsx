import Link from 'next/link'
import Footer from '@/components/Footer'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center px-4 py-2 mb-6 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Hubungi Kami
        </h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-600 mb-6">
            Jika Anda memiliki pertanyaan atau masalah dengan UPer.li, hubungi kami melalui:
          </p>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informasi Kontak</h2>
            <ul className="space-y-2 text-gray-700">
              <li>
                <strong>Email:</strong> support@uper.li
              </li>
            </ul>
          </div>

          <p className="mt-6 text-gray-600">
            Kami akan berusaha menjawab pertanyaan Anda dalam 1-2 hari kerja.
          </p>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}