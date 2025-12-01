'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSession } from 'next-auth/react'
import LinkItem from '@/components/LinkItem'
import { QRCodeCanvas } from 'qrcode.react'

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
  lastVisited?: Date | null
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface UserStats {
  totalLinks: number
  monthlyLinks: number
  role: 'STUDENT' | 'STAFF'
  totalActiveLinks: number
}

function CountUp({ end, duration = 2000 }: { readonly end: number, readonly duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }
    window.requestAnimationFrame(step)
  }, [end, duration])

  return <>{count}</>
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [userStats, setUserStats] = useState<UserStats | null>(null)

  // Links tab state
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'visitCount' | 'shortUrl'>('createdAt')
  const [sortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)

  // Analytics tab state
  const [totalVisits, setTotalVisits] = useState(0)
  const [timeZone, setTimeZone] = useState('Asia/Jakarta')

  // QR modal state
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrModalLink, setQrModalLink] = useState<Link | null>(null)
  const qrModalRef = useRef<HTMLCanvasElement>(null)

  // QR Customization State
  const [qrFgColor, setQrFgColor] = useState('#000000')
  const [qrBgColor, setQrBgColor] = useState('#ffffff')
  const [qrSize, setQrSize] = useState(256)
  const [qrLevel, setQrLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H')
  const [qrIncludeMargin, setQrIncludeMargin] = useState(true)

  const openQrModal = (link: Link) => {
    setQrModalLink(link)
    setQrFgColor('#000000')
    setQrBgColor('#ffffff')
    setQrSize(256)
    setQrLevel('H')
    setQrIncludeMargin(true)
    setShowQrModal(true)
  }



  // Create form collapse state
  const [isCreateFormCollapsed, setIsCreateFormCollapsed] = useState(true)

  // Fetch user stats
  const fetchUserStats = async () => {
    const response = await fetch('/api/user/stats')
    if (response.ok) {
      const data = await response.json()
      setUserStats(data)
    }
  }

  // Fetch links for Links tab
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

  // Fetch links for analytics data
  const fetchAnalyticsLinks = async () => {
    const response = await fetch('/api/links?sort=visitCount&order=desc')
    if (response.ok) {
      const data = await response.json()
      const total = data.links.reduce((sum: number, link: Link) => sum + (link.visitCount || 0), 0)
      setTotalVisits(total)
    }
  }


  useEffect(() => {
    fetchUserStats()
  }, [])

  useEffect(() => {
    fetchLinks(1)
    fetchAnalyticsLinks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, sortBy, sortOrder])

  // Links tab functions
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
      fetchUserStats()
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

    let passwordToSend = undefined
    if (passwordRemoved) {
      passwordToSend = ''
    } else if (editPassword !== '') {
      passwordToSend = editPassword
    }

    const response = await fetch(`/api/links/${editingLink.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shortUrl: editCustomUrl !== editingLink.shortUrl ? editCustomUrl : undefined,
        mode: editMode,
        password: passwordToSend,
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
      fetchUserStats()
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


  const maxMonthly = userStats?.role === 'STUDENT' ? 5 : 10
  const monthlyLinks = userStats?.monthlyLinks || 0

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-3 text-lg text-gray-600">
          Selamat datang, <span className="font-semibold">{session?.user?.nimOrUsername}</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12 max-w-7xl mx-auto">
        {/* Total Links Card */}
        <div className="group bg-white overflow-hidden shadow-md hover:shadow-xl border border-gray-300 rounded-2xl transition-all duration-200">
          <div className="p-6 sm:p-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
              </div>
              <div className="ml-6 flex-1">
                <dt className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Total Link
                </dt>
                <dd className="text-3xl font-bold text-gray-900 mt-1">
                  <CountUp end={userStats?.totalLinks || 0} />
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 px-6 py-3">
            <p className="text-xs text-blue-700 font-medium">Semua link yang dibuat</p>
          </div>
        </div>

        {/* Monthly Links Card */}
        <div className="group bg-white overflow-hidden shadow-md hover:shadow-xl border border-gray-300 rounded-2xl transition-all duration-200">
          <div className="p-6 sm:p-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-6 flex-1">
                <dt className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Link Bulan Ini
                </dt>
                <dd className="text-3xl font-bold text-gray-900 mt-1">
                  <CountUp end={monthlyLinks} /> / {maxMonthly}
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100/50 px-6 py-3">
            <p className="text-xs text-green-700 font-medium">Kuota bulanan tersisa: {maxMonthly - monthlyLinks}</p>
          </div>
        </div>

        {/* Role Card */}
        <div className="group bg-white overflow-hidden shadow-md hover:shadow-xl border border-gray-300 rounded-2xl transition-all duration-200">
          <div className="p-6 sm:p-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-6 flex-1">
                <dt className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Peran
                </dt>
                <dd className="text-3xl font-bold text-gray-900 mt-1">
                  {userStats?.role === 'STUDENT' ? 'Mahasiswa' : 'Dosen/Staff'}
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 px-6 py-3">
            <p className="text-xs text-purple-700 font-medium">Status akun Anda</p>
          </div>
        </div>

        {/* Total Kunjungan Card */}
        <div className="group bg-white overflow-hidden shadow-md hover:shadow-xl border border-gray-300 rounded-2xl transition-all duration-200">
          <div className="p-6 sm:p-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-6 flex-1">
                <dt className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Total Kunjungan
                </dt>
                <dd className="text-3xl font-bold text-gray-900 mt-1">
                  <CountUp end={totalVisits} />
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 px-6 py-3">
            <p className="text-xs text-orange-700 font-medium">Total kunjungan semua link</p>
          </div>
        </div>

        {/* Link Aktif Card */}
        <div className="group bg-white overflow-hidden shadow-md hover:shadow-xl border border-gray-300 rounded-2xl transition-all duration-200">
          <div className="p-6 sm:p-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-6 flex-1">
                <dt className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Link Aktif
                </dt>
                <dd className="text-3xl font-bold text-gray-900 mt-1">
                  <CountUp end={userStats?.totalActiveLinks || 0} />
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-sky-50 to-sky-100/50 px-6 py-3">
            <p className="text-xs text-sky-700 font-medium">Total link aktif</p>
          </div>
        </div>
      </div>


      {/* Content */}
      <div className="mt-8">
        <div>
          <div className="bg-white shadow-md border border-gray-300 rounded-lg mb-6 sm:mb-8">
            <div
              className={`flex items-center justify-between p-6 sm:p-8 cursor-pointer hover:bg-gray-50 rounded-t-lg transition-colors border-b ${isCreateFormCollapsed ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}`}
              onClick={() => setIsCreateFormCollapsed(!isCreateFormCollapsed)}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Buat Link Baru</h2>
              </div>
              <svg
                className={`w-5 h-5 transform transition-transform ${isCreateFormCollapsed ? 'rotate-0' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {!isCreateFormCollapsed && <div className="p-6 sm:p-8">
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
            </div>}
          </div>

          {/* Filter Controls */}
          <div className="bg-white shadow-md border border-gray-300 rounded-lg p-8 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div>
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

              <div>
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

              <div>
                <label htmlFor="timezone" className="block text-base font-medium text-gray-700 mb-3">
                  Zona Waktu
                </label>
                <select
                  id="timezone"
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-base"
                >
                  <option value="Asia/Jakarta">WIB (Jakarta)</option>
                  <option value="Asia/Makassar">WITA (Makassar)</option>
                  <option value="Asia/Jayapura">WIT (Jayapura)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </div>

          {/* Links List */}
          <div className="bg-white shadow-md overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {links.map((link) => (
                <LinkItem
                  key={link.id}
                  link={link}
                  timeZone={timeZone}
                  onEdit={startEdit}
                  onDelete={(id) => setShowDeleteConfirm(id)}
                  onToggleActive={toggleActive}
                  onOpenQr={openQrModal}
                />
              ))}
              {links.length === 0 && (
                <li>
                  <div className="px-4 py-12 sm:px-6 text-center">
                    <h3 className="text-lg font-medium text-gray-900">Belum ada link</h3>
                    <p className="mt-1 text-sm text-gray-500">Mulai buat link pendek pertamamu sekarang!</p>
                  </div>
                </li>
              )}
            </ul>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-300 sm:px-6 mt-6 shadow-md">
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
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pageNum === currentPage
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
          {editingLink && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[100]">
              <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={cancelEdit}
              />
              <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 sm:p-8 relative z-10">
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
                      disabled={passwordRemoved}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Masukkan password baru"
                    />
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
                    <p className="mt-2 text-sm text-gray-500">
                      Minimal 4 karakter. Klik &ldquo;Hapus Password&rdquo; untuk menghapus proteksi. Kosongkan untuk mempertahankan password yang ada.
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
            </div>,
            document.body
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[100]">
              <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={() => setShowDeleteConfirm(null)}
              />
              <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 sm:p-8 relative z-10">
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
            </div>,
            document.body
          )}

          {/* QR Modal */}
          {showQrModal && qrModalLink && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[100]">
              <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={() => { setShowQrModal(false); setQrModalLink(null); }}
              />
              <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 sm:p-8 relative z-10 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">QR Code</h3>
                <p className="text-base text-gray-600 mb-6">
                  uper.li/{qrModalLink.shortUrl}
                </p>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 flex flex-col items-center space-y-6">
                    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <QRCodeCanvas
                        value={`https://uper.li/${qrModalLink.shortUrl}`}
                        size={qrSize}
                        fgColor={qrFgColor}
                        bgColor={qrBgColor}
                        level={qrLevel}
                        includeMargin={qrIncludeMargin}
                        ref={qrModalRef}
                        style={{ width: '256px', height: '256px' }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!qrModalRef.current) return
                        const canvas = qrModalRef.current
                        const link = document.createElement('a')
                        link.download = `qr-${qrModalLink.shortUrl}.png`
                        link.href = canvas.toDataURL()
                        link.click()
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download PNG
                    </button>
                  </div>

                  {/* Customization Controls */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Warna QR</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={qrFgColor}
                          onChange={(e) => setQrFgColor(e.target.value)}
                          className="h-8 w-8 rounded border border-gray-300 cursor-pointer"
                        />
                        <span className="text-sm text-gray-500">{qrFgColor}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Warna Background</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={qrBgColor}
                          onChange={(e) => setQrBgColor(e.target.value)}
                          className="h-8 w-8 rounded border border-gray-300 cursor-pointer"
                        />
                        <span className="text-sm text-gray-500">{qrBgColor}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ukuran (px)</label>
                      <select
                        value={qrSize}
                        onChange={(e) => setQrSize(Number(e.target.value))}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value={128}>128 x 128</option>
                        <option value={256}>256 x 256</option>
                        <option value={512}>512 x 512</option>
                        <option value={1024}>1024 x 1024</option>
                        <option value={2048}>2048 x 2048</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Error Correction Level</label>
                      <select
                        value={qrLevel}
                        onChange={(e) => setQrLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="L">Low (7%)</option>
                        <option value="M">Medium (15%)</option>
                        <option value="Q">Quartile (25%)</option>
                        <option value="H">High (30%)</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="include-margin"
                        type="checkbox"
                        checked={qrIncludeMargin}
                        onChange={(e) => setQrIncludeMargin(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="include-margin" className="ml-2 block text-sm text-gray-900">
                        Gunakan Margin
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-8">
                  <button
                    onClick={() => { setShowQrModal(false); setQrModalLink(null); }}
                    className="px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>


      </div >
    </div >
  )
}

