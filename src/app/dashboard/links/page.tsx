'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ShortUrlActions from '@/components/ShortUrlActions'

interface Link {
  id: string
  shortUrl: string
  longUrl: string
  custom: boolean
  customChanges: number
  customChangedAt: string | null
  mode: 'PREVIEW' | 'DIRECT'
  active: boolean
  createdAt: string
  visitCount: number
  hasPassword: boolean
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function LinksPage() {
  const { data: session } = useSession()
  const [links, setLinks] = useState<Link[]>([])
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [longUrl, setLongUrl] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [editCustomUrl, setEditCustomUrl] = useState('')
  const [editMode, setEditMode] = useState<'PREVIEW' | 'DIRECT'>('PREVIEW')
  const [editPassword, setEditPassword] = useState('')
  const [passwordRemoved, setPasswordRemoved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'visitCount' | 'shortUrl'>('createdAt')
  const [sortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchLinks = async (page = currentPage) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      sort: sortBy,
      order: sortOrder,
    })

    if (activeFilter !== 'all') {
      params.append('active', activeFilter === 'active' ? 'true' : 'false')
    }

    const response = await fetch(`/api/links?${params}`)
    if (response.ok) {
      const data = await response.json()
      setLinks(data.links)
      setPagination(data.pagination)
      setCurrentPage(page)
    }
  }

  useEffect(() => {
    fetchLinks(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, sortBy, sortOrder])

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
        password: password || undefined,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      setSuccess('Link berhasil dibuat!')
      setLongUrl('')
      setCustomUrl('')
      setPassword('')
      fetchLinks(currentPage)
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
    fetchLinks(currentPage)
  }

  const startEdit = (link: Link) => {
    setEditingLink(link)
    setEditCustomUrl(link.shortUrl)
    setEditMode(link.mode)
    setEditPassword('')
    setPasswordRemoved(false)
  }

  const cancelEdit = () => {
    setEditingLink(null)
    setEditCustomUrl('')
    setEditMode('PREVIEW')
    setEditPassword('')
    setPasswordRemoved(false)
  }

  const saveEdit = async () => {
    if (!editingLink) return

    setLoading(true)
    setError('')

    const response = await fetch(`/api/links/${editingLink.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shortUrl: editCustomUrl !== editingLink.shortUrl ? editCustomUrl : undefined,
        mode: editMode,
        password: editPassword,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      setSuccess('Link berhasil diperbarui!')
      fetchLinks(currentPage)
      cancelEdit()
      setPasswordRemoved(false)
    } else {
      setError(data.error || 'Terjadi kesalahan.')
    }

    setLoading(false)
  }

  const deleteLink = async (id: string) => {
    setLoading(true)
    setError('')

    const response = await fetch(`/api/links/${id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setSuccess('Link berhasil dihapus!')
      fetchLinks(currentPage)
      setShowDeleteConfirm(null)
    } else {
      const data = await response.json()
      setError(data.error || 'Terjadi kesalahan.')
    }

    setLoading(false)
  }

  const handleFilterChange = (filter: 'all' | 'active' | 'inactive') => {
    setActiveFilter(filter)
    setCurrentPage(1)
  }

  const handleSortChange = (sort: 'createdAt' | 'visitCount' | 'shortUrl') => {
    setSortBy(sort)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchLinks(page)
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kelola Link</h1>
        <p className="mt-1 text-sm text-gray-600">
          Buat dan kelola short link Anda
        </p>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 sm:p-8 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 sm:mb-8">Buat Link Baru</h2>
        <form onSubmit={handleCreateLink} className="space-y-6 sm:space-y-8">
          <div>
            <label htmlFor="longUrl" className="block text-base font-medium text-gray-700 mb-3">
              URL Asli
            </label>
            <input
              type="url"
              id="longUrl"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              required
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 text-base"
              placeholder="https://example.com/a-long-url/that-need-to-be-shortened"
            />
          </div>
          <div>
            <label htmlFor="customUrl" className="block text-base font-medium text-gray-700 mb-3">
              Short URL Kustom (opsional)
            </label>
            <div className="flex rounded-md shadow-sm border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <span className="inline-flex items-center px-4 bg-gray-50 text-gray-500 text-base border-r border-gray-300">
                uper.li/
              </span>
              <input
                type="text"
                id="customUrl"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 px-4 py-3 border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-500 text-base"
                placeholder="custom-url"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-base font-medium text-gray-700 mb-3">
              Password (opsional)
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 text-base"
              placeholder="Minimal 4 karakter"
            />
            <p className="mt-2 text-sm text-gray-500">
              Kosongkan jika tidak ingin melindungi link.
            </p>
          </div>
          {error && (
            <div className="text-red-600 text-base">
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-600 text-base">
              {success}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Membuat...' : 'Buat Link'}
          </button>
        </form>
      </div>

      {/* Filter Controls */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-8 mb-6">
        <div className="flex flex-col sm:flex-row gap-8">
          <div className="flex-1">
            <label htmlFor="filter" className="block text-base font-medium text-gray-700 mb-3">
              Status
            </label>
            <select
              id="filter"
              value={activeFilter}
              onChange={(e) => handleFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-base"
            >
              <option value="all">Semua</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="sort" className="block text-base font-medium text-gray-700 mb-3">
              Urutkan
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as 'createdAt' | 'visitCount' | 'shortUrl')}
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-base"
            >
              <option value="createdAt">Tanggal Dibuat</option>
              <option value="visitCount">Jumlah Kunjungan</option>
              <option value="shortUrl">Short URL</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {links.map((link) => (
            <li key={link.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <ShortUrlActions shortUrl={link.shortUrl} />
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
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-4 sm:mt-0">
                    <button
                      onClick={() => startEdit(link)}
                      className="inline-flex items-center justify-center px-3 py-2 sm:py-1 rounded-md text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 min-h-[44px] sm:min-h-0"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(link.id, link.active)}
                      className={`inline-flex items-center justify-center px-3 py-2 sm:py-1 rounded-md text-sm font-medium min-h-[44px] sm:min-h-0 ${
                        link.active
                          ? 'text-red-700 bg-red-100 hover:bg-red-200'
                          : 'text-green-700 bg-green-100 hover:bg-green-200'
                      }`}
                    >
                      {link.active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(link.id)}
                      className="inline-flex items-center justify-center px-3 py-2 sm:py-1 rounded-md text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 min-h-[44px] sm:min-h-0"
                    >
                      Hapus
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNext}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Menampilkan <span className="font-medium">{(currentPage - 1) * pagination.limit + 1}</span> sampai{' '}
                <span className="font-medium">{Math.min(currentPage * pagination.limit, pagination.total)}</span> dari{' '}
                <span className="font-medium">{pagination.total}</span> hasil
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Sebelumnya</span>
                  ‹
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i
                  if (pageNum > pagination.totalPages) return null
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Selanjutnya</span>
                  ›
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-8">Edit Link</h3>
            <div className="space-y-8">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">Short URL</label>
                <div className="flex rounded-md shadow-sm border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                  <span className="inline-flex items-center px-4 bg-gray-50 text-gray-500 text-base border-r border-gray-300">
                    uper.li/
                  </span>
                  <input
                    type="text"
                    value={editCustomUrl}
                    onChange={(e) => setEditCustomUrl(e.target.value)}
                    className="flex-1 px-4 py-3 border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-500 text-base"
                    placeholder="custom-url"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Perubahan bulan ini: {editingLink.customChanges}/2
                </p>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">Mode Redirect</label>
                <select
                  value={editMode}
                  onChange={(e) => setEditMode(e.target.value as 'PREVIEW' | 'DIRECT')}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-base"
                >
                  <option value="PREVIEW">Preview</option>
                  <option value="DIRECT">Direct</option>
                </select>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">Password</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 text-base"
                  placeholder="Masukkan password baru"
                />
                {editingLink?.hasPassword && (
                  <>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => { setEditPassword(''); setPasswordRemoved(true); }}
                        className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md"
                      >
                        Hapus Password
                      </button>
                    </div>
                    {passwordRemoved && (
                      <p className="mt-2 text-sm text-red-600">
                        Password akan dihapus saat menyimpan perubahan.
                      </p>
                    )}
                  </>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Minimal 4 karakter. {editingLink?.hasPassword ? 'Klik "Hapus Password" untuk menghapus proteksi.' : 'Kosongkan untuk tidak menggunakan password.'}
                </p>
              </div>
            </div>
            {error && (
              <div className="mt-6 text-red-600 text-base">
                {error}
              </div>
            )}
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={cancelEdit}
                className="px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Batal
              </button>
              <button
                onClick={saveEdit}
                disabled={loading}
                className="px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Konfirmasi Hapus</h3>
            <p className="text-base text-gray-600 mb-8">
              Apakah Anda yakin ingin menghapus link ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            {error && (
              <div className="mb-6 text-red-600 text-base">
                {error}
              </div>
            )}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Batal
              </button>
              <button
                onClick={() => deleteLink(showDeleteConfirm)}
                disabled={loading}
                className="px-6 py-3 text-base font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}