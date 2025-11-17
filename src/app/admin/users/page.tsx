'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  nimOrUsername: string
  role: 'STUDENT' | 'STAFF' | 'ADMIN'
  emailVerified: boolean | null
  twoFactorEnabled: boolean
  monthlyLinksCreated: number
  totalLinks: number
  createdAt: string
  active: boolean
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'STUDENT' | 'STAFF' | 'ADMIN'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchUsers = async () => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: '20',
    })

    if (searchTerm) {
      params.append('search', searchTerm)
    }

    if (roleFilter !== 'all') {
      params.append('role', roleFilter)
    }

    const response = await fetch(`/api/admin/users?${params}`)
    if (response.ok) {
      const data = await response.json()
      setUsers(data.users)
      setTotalPages(data.pagination.totalPages)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm, roleFilter])

  const toggleUserStatus = async (userId: string, active: boolean) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ active: !active }),
    })
    fetchUsers()
  }

  const changeUserRole = async (userId: string, newRole: 'STUDENT' | 'STAFF' | 'ADMIN') => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: newRole }),
    })
    fetchUsers()
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">Memuat...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage user accounts and permissions
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Cari User
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Cari berdasarkan NIM/Username atau email..."
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Peran
            </label>
            <select
              id="role"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as 'all' | 'STUDENT' | 'STAFF' | 'ADMIN')
                setCurrentPage(1)
              }}
              className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">Semua</option>
              <option value="STUDENT">Mahasiswa</option>
              <option value="STAFF">Dosen/Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
            <li key={user.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.nimOrUsername}
                      </p>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'STAFF' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'STUDENT' ? 'Mahasiswa' : user.role === 'STAFF' ? 'Dosen/Staff' : 'Admin'}
                      </span>
                      {user.twoFactorEnabled && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          2FA
                        </span>
                      )}
                      {!user.active && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {user.email}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Bergabung: {new Date(user.createdAt).toLocaleDateString('id-ID')} |
                      Link: {user.totalLinks} |
                      Bulan ini: {user.monthlyLinksCreated}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={user.role}
                      onChange={(e) => changeUserRole(user.id, e.target.value as 'STUDENT' | 'STAFF' | 'ADMIN')}
                      className="text-xs border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="STUDENT">Mahasiswa</option>
                      <option value="STAFF">Dosen/Staff</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button
                      onClick={() => toggleUserStatus(user.id, user.active)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        user.active
                          ? 'text-red-700 bg-red-100 hover:bg-red-200'
                          : 'text-green-700 bg-green-100 hover:bg-green-200'
                      }`}
                    >
                      {user.active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {users.length === 0 && (
            <li>
              <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                Tidak ada user yang ditemukan.
              </div>
            </li>
          )}
        </ul>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Halaman {currentPage} dari {totalPages}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                  if (pageNum > totalPages) return null
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
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
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  ›
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}