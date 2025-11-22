'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ChangePasswordForm from './ChangePasswordForm'
import { logger } from '@/lib/logger'

interface User {
  id: string
  email: string
  role: 'STUDENT' | 'STAFF' | 'ADMIN'
  nimOrUsername: string
  emailVerified: boolean | null
  monthlyLinksCreated: number
  totalLinks: number
  twoFactorEnabled: boolean
}

export default function AccountPage() {
  useSession()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [showVerification, setShowVerification] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch {
      logger.error('Failed to fetch user data')
    } finally {
      setLoading(false)
    }
  }

  const handleEnable2FA = async () => {
    setTwoFactorLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/2fa/setup', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setShowVerification(true)
      } else {
        setError(data.error || 'Terjadi kesalahan.')
      }
    } catch {
      setError('Terjadi kesalahan.')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleVerify2FA = async () => {
    setTwoFactorLoading(true)
    setError('')

    try {
      const response = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verificationCode }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setShowVerification(false)
        setVerificationCode('')
        fetchUserData() // Refresh user data
      } else {
        setError(data.error || 'Terjadi kesalahan.')
      }
    } catch {
      setError('Terjadi kesalahan.')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan 2FA?')) {
      return
    }

    setTwoFactorLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/2fa/disable', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        fetchUserData() // Refresh user data
      } else {
        setError(data.error || 'Terjadi kesalahan.')
      }
    } catch {
      setError('Terjadi kesalahan.')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">Memuat...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">User tidak ditemukan.</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pengaturan Akun</h1>
        <p className="mt-2 text-base sm:text-lg text-gray-600">
          Kelola informasi akun Anda
        </p>
      </div>

      <div className="space-y-6 sm:space-y-8">
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <h3 className="text-xl sm:text-2xl leading-6 font-semibold text-gray-900 mb-6 sm:mb-8">
              Informasi Akun
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 sm:grid-cols-2">
              <div>
                <dt className="text-base font-medium text-gray-500">Email</dt>
                <dd className="mt-2 text-sm sm:text-lg text-gray-900 break-words">{user.email}</dd>
              </div>
              <div>
                <dt className="text-base font-medium text-gray-500">Peran</dt>
                <dd className="mt-2 text-lg text-gray-900">
                  {user.role === 'STUDENT' ? 'Mahasiswa' : 'Dosen/Staff'}
                </dd>
              </div>
              <div>
                <dt className="text-base font-medium text-gray-500">NIM/Username</dt>
                <dd className="mt-2 text-lg text-gray-900">{user.nimOrUsername}</dd>
              </div>
              <div>
                <dt className="text-base font-medium text-gray-500">Status Verifikasi</dt>
                <dd className="mt-2 text-lg text-gray-900">
                  {user.emailVerified ? 'Terverifikasi' : 'Belum Terverifikasi'}
                </dd>
              </div>
              <div>
                <dt className="text-base font-medium text-gray-500">Link Bulan Ini</dt>
                <dd className="mt-2 text-lg text-gray-900">
                  {user.monthlyLinksCreated} / {user.role === 'STUDENT' ? 5 : 10}
                </dd>
              </div>
              <div>
                <dt className="text-base font-medium text-gray-500">Total Link</dt>
                <dd className="mt-2 text-lg text-gray-900">
                  {user.totalLinks} / {user.role === 'STUDENT' ? 100 : 200}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
          <div className="px-8 py-8 sm:p-8">
            <h3 className="text-2xl leading-6 font-semibold text-gray-900 mb-8">
              Two-Factor Authentication (2FA)
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base text-gray-600">
                    Tambahkan lapisan keamanan ekstra dengan 2FA via email
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Status: {user.twoFactorEnabled ? 'Aktif' : 'Nonaktif'}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {user.twoFactorEnabled ? (
                    <button
                      onClick={handleDisable2FA}
                      disabled={twoFactorLoading}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {twoFactorLoading ? 'Menonaktifkan...' : 'Nonaktifkan 2FA'}
                    </button>
                  ) : (
                    <button
                      onClick={handleEnable2FA}
                      disabled={twoFactorLoading}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {twoFactorLoading ? 'Mengirim kode...' : 'Aktifkan 2FA'}
                    </button>
                  )}
                </div>
              </div>

              {showVerification && (
                <div className="border-t border-gray-200 pt-6">
                  <p className="text-base text-gray-600 mb-4">
                    Masukkan kode verifikasi yang dikirim ke email Anda:
                  </p>
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="000000"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 text-base"
                      maxLength={6}
                    />
                    <button
                      onClick={handleVerify2FA}
                      disabled={twoFactorLoading || verificationCode.length !== 6}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {twoFactorLoading ? 'Memverifikasi...' : 'Verifikasi'}
                    </button>
                  </div>
                </div>
              )}

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
            </div>
          </div>
        </div>

        <ChangePasswordForm />
      </div>
    </div>
  )
}