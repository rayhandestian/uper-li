'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Link {
  id: string
  shortUrl: string
  longUrl: string
  custom: boolean
  active: boolean
  createdAt: string
  visitCount: number
}

export default function LinksPage() {
  const { data: session } = useSession()
  const [links, setLinks] = useState<Link[]>([])
  const [longUrl, setLongUrl] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    const response = await fetch('/api/links')
    if (response.ok) {
      const data = await response.json()
      setLinks(data)
    }
  }

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const response = await fetch('/api/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        longUrl,
        customUrl: customUrl || undefined,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      setSuccess('Link berhasil dibuat!')
      setLongUrl('')
      setCustomUrl('')
      fetchLinks()
    } else {
      setError(data.error || 'Terjadi kesalahan.')
    }

    setLoading(false)
  }

  const toggleActive = async (id: string, active: boolean) => {
    await fetch(`/api/links/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ active: !active }),
    })
    fetchLinks()
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Link</h1>
        <p className="mt-1 text-sm text-gray-600">
          Buat dan kelola short link Anda
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Buat Link Baru</h2>
        <form onSubmit={handleCreateLink} className="space-y-4">
          <div>
            <label htmlFor="longUrl" className="block text-sm font-medium text-gray-700">
              URL Asli
            </label>
            <input
              type="url"
              id="longUrl"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label htmlFor="customUrl" className="block text-sm font-medium text-gray-700">
              Short URL Kustom (opsional)
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                uper.link/
              </span>
              <input
                type="text"
                id="customUrl"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="custom-name"
              />
            </div>
          </div>
          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-600 text-sm">
              {success}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Membuat...' : 'Buat Link'}
          </button>
        </form>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {links.map((link) => (
            <li key={link.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        uper.link/{link.shortUrl}
                      </p>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        link.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {link.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {link.longUrl}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Dibuat: {new Date(link.createdAt).toLocaleDateString('id-ID')} | Kunjungan: {link.visitCount}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleActive(link.id, link.active)}
                      className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                        link.active
                          ? 'text-red-700 bg-red-100 hover:bg-red-200'
                          : 'text-green-700 bg-green-100 hover:bg-green-200'
                      }`}
                    >
                      {link.active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {links.length === 0 && (
            <li>
              <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                Belum ada link yang dibuat.
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}