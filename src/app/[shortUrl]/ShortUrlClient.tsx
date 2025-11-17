'use client'

import { useState } from 'react'
import Footer from '@/components/Footer'

interface LinkData {
  status: 'not_found' | 'inactive' | 'locked' | 'ok'
  longUrl?: string
  mode?: string
  id?: number
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
      <div className="min-h-screen bg-white flex flex-col">
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="max-w-md w-full space-y-8 text-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                UPer.li
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Short URL tidak ditemukan.
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Mungkin URL sudah dihapus atau salah ketik.
              </p>
              <a
                href="https://app.uper.li"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Kembali ke Beranda
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (initialData.status === 'inactive') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="max-w-md w-full space-y-8 text-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                UPer.li
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Short URL ini sudah dinonaktifkan.
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Hubungi pemilik link jika Anda membutuhkan akses.
              </p>
              <a
                href="https://app.uper.li"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Kembali ke Beranda
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (initialData.status === 'locked') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Link Terkunci
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Masukkan password untuk mengakses link ini
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handlePasswordSubmit}>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={verifying}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {verifying ? 'Memverifikasi...' : 'Akses Link'}
                </button>
              </div>

              <div className="text-center">
                <a href="https://app.uper.li" className="text-blue-600 hover:text-blue-500">
                  Kembali ke Beranda
                </a>
              </div>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (initialData.status === 'ok' && initialData.longUrl && initialData.mode === 'PREVIEW') {
    // Preview mode - show destination and let user click to continue
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="max-w-md w-full space-y-8 text-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                UPer.li
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Anda akan diarahkan ke:
              </p>
              <p className="text-sm text-gray-500 mb-8 break-all">
                {initialData.longUrl}
              </p>
              <a
                href={initialData.longUrl}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Lanjutkan ke Tujuan
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return null
}