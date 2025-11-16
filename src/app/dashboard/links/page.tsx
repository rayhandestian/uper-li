'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
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

    if (searchTerm) {
      params.append('search', searchTerm)
    }

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
    fetchLinks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  }

  const cancelEdit = () => {
    setEditingLink(null)
    setEditCustomUrl('')
    setEditMode('PREVIEW')
    setEditPassword('')
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
        password: editPassword || undefined,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      setSuccess('Link berhasil diperbarui!')
      fetchLinks(currentPage)
      cancelEdit()
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

  const handleSearch = () => {
    setCurrentPage(1)
    fetchLinks(1)
  }

  const handleFilterChange = (filter: 'all' | 'active' | 'inactive') => {
    setActiveFilter(filter)
    setCurrentPage(1)
    fetchLinks(1)
  }

  const handleSortChange = (sort: 'createdAt' | 'visitCount' | 'shortUrl') => {
    setSortBy(sort)
    setCurrentPage(1)
    fetchLinks(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchLinks(page)
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
              placeholder="https://example.com/a-long-url/that-need-to-be-shortened"
            />
          </div>
          <div>
            <label htmlFor="customUrl" className="block text-sm font-medium text-gray-700">
              Short URL Kustom (opsional)
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                uper.li/
              </span>
              <input
                type="text"
                id="customUrl"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="ShortURL"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password (opsional)
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Lindungi link dengan password"
            />
            <p className="mt-1 text-xs text-gray-500">
              Minimal 4 karakter. Kosongkan jika tidak ingin melindungi link.
            </p>
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

      {/* Search and Filter Controls */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Cari Link
            </label>
            <div className="flex">
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari berdasarkan short URL atau URL asli..."
                className="flex-1 border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 border border-l-0 border-gray-300 bg-gray-50 rounded-r-md hover:bg-gray-100"
              >
                Cari
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="filter"
              value={activeFilter}
              onChange={(e) => handleFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
              className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">Semua</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
              Urutkan
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as 'createdAt' | 'visitCount' | 'shortUrl')}
              className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                      <p className="text-sm font-medium text-blue-600 truncate">
                        uper.li/{link.shortUrl}
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
                      onClick={() => startEdit(link)}
                      className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      Edit
                    </button>
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
                    <button
                      onClick={() => setShowDeleteConfirm(link.id)}
                      className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200"
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Link</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Short URL</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      uper.li/
                    </span>
                    <input
                      type="text"
                      value={editCustomUrl}
                      onChange={(e) => setEditCustomUrl(e.target.value)}
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Perubahan bulan ini: {editingLink.customChanges}/2
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mode Redirect</label>
                  <select
                    value={editMode}
                    onChange={(e) => setEditMode(e.target.value as 'PREVIEW' | 'DIRECT')}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="PREVIEW">Preview (aman)</option>
                    <option value="DIRECT">Direct (langsung)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Kosongkan untuk menghapus password"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Minimal 4 karakter. Kosongkan untuk menghapus proteksi password.
                  </p>
                </div>
              </div>
              {error && (
                <div className="mt-4 text-red-600 text-sm">
                  {error}
                </div>
              )}
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  onClick={saveEdit}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Konfirmasi Hapus</h3>
              <p className="text-sm text-gray-600 mb-4">
                Apakah Anda yakin ingin menghapus link ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              {error && (
                <div className="mb-4 text-red-600 text-sm">
                  {error}
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  onClick={() => deleteLink(showDeleteConfirm)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}