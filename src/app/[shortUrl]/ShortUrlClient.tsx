'use client'

import { useState } from 'react'
import Link from 'next/link'
import Footer from '@/components/Footer'

interface LinkData {
  status: 'not_found' | 'inactive' | 'locked' | 'ok'
  longUrl?: string
  mode?: string
  id?: string
}

interface Props {
  initialData: LinkData
  shortUrl: string
}

export default function ShortUrlClient({ initialData, shortUrl }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setVerifying(true)

    const response = await fetch('/api/verify-link-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shortUrl, password })
    })

    const result = await response.json()

    if (response.ok && initialData?.longUrl) {
      // Log visit
      if (initialData.id) {
        await fetch('/api/links/log-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkId: initialData.id })
        })
      }
      window.location.href = initialData.longUrl
    } else {
      setError(result.error || 'Password salah.')
    }

    setVerifying(false)
  }

  if (initialData.status === 'not_found') {
    return (
      <div className="min-h-screen gradient-bg flex flex-col">
        <main className="flex-grow flex items-center justify-center px-4 py-12">
          <div className="max-w-lg w-full">
            <div className="mb-8">
              <Link href="/" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Beranda
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Link Tidak Ditemukan
                  </h2>
                  <p className="text-base text-gray-600">
                    Short URL yang Anda cari tidak tersedia.
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-base text-gray-500">
                    Kemungkinan penyebab:
                  </p>
                  <ul className="text-base text-gray-500 text-left space-y-1">
                    <li>• Link sudah dihapus oleh pemilik</li>
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

  if (initialData.status === 'inactive') {
    return (
      <div className="min-h-screen gradient-bg flex flex-col">
        <main className="flex-grow flex items-center justify-center px-4 py-12">
          <div className="max-w-lg w-full">
            <div className="mb-8">
              <Link href="/" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Beranda
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Link Dinonaktifkan
                  </h2>
                  <p className="text-base text-gray-600">
                    Short URL ini telah dinonaktifkan oleh pemiliknya.
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Untuk mendapatkan akses, silakan hubungi pemilik link.
                  </p>
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

  if (initialData.status === 'locked') {
    return (
      <div className="min-h-screen gradient-bg flex flex-col">
        <main className="flex-grow flex items-center justify-center px-4 py-12">
          <div className="max-w-lg w-full">
            <div className="mb-8">
              <Link href="/" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Beranda
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Link Terkunci
                </h2>
                <p className="text-base text-gray-600">
                  Masukkan password untuk mengakses link ini
                </p>
              </div>

              <form className="space-y-5" onSubmit={handlePasswordSubmit}>
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none rounded-xl block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-describedby="password-error"
                  />
                </div>

                {error && (
                  <div id="password-error" className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={verifying}
                    className="w-full flex justify-center items-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl min-h-[52px]"
                  >
                    {verifying ? 'Memverifikasi...' : 'Akses Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (initialData.status === 'ok' && initialData.longUrl && initialData.mode === 'PREVIEW') {
    // Preview mode - show destination and let user click to continue
    return (
      <div className="min-h-screen gradient-bg flex flex-col">
        <main className="flex-grow flex items-center justify-center px-4 py-12">
          <div className="max-w-lg w-full">
            <div className="mb-8">
              <Link href="/" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Beranda
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Pratinjau Link
                  </h2>
                  <p className="text-base text-gray-600">
                    Anda akan diarahkan ke tujuan berikut:
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-8">
                  <p className="text-base text-gray-700 break-all font-mono">
                    {initialData.longUrl}
                  </p>
                </div>

                <div className="space-y-4">
                  <a
                    href={initialData.longUrl}
                    className="w-full flex justify-center items-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl min-h-[52px]"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Lanjutkan ke Tujuan
                  </a>

                  <p className="text-xs text-gray-500">
                    Klik tombol di atas untuk melanjutkan ke link tujuan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return null
}