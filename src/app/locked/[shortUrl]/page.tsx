'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PageProps {
  params: {
    shortUrl: string
  }
}

export default function LockedPage({ params }: PageProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const originalUrl = searchParams.get('url') || ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const response = await fetch('/api/verify-link-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shortUrl: params.shortUrl,
        password,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      // Redirect to the original URL
      window.location.href = originalUrl
    } else {
      setError(data.error || 'Password salah.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Link Terkunci
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Masukkan password untuk mengakses link ini
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Memverifikasi...' : 'Akses Link'}
            </button>
          </div>

          <div className="text-center">
            <a href="/" className="text-blue-600 hover:text-blue-500">
              Kembali ke Beranda
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}