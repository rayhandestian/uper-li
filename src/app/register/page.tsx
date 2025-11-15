'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Turnstile } from '@marsidev/react-turnstile'

export default function RegisterPage() {
  const [role, setRole] = useState<'STUDENT' | 'STAFF'>('STUDENT')
  const [nimOrUsername, setNimOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const emailPreview = role === 'STUDENT'
    ? `${nimOrUsername}@student.universitaspertamina.ac.id`
    : `${nimOrUsername}@universitaspertamina.ac.id`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!turnstileToken) {
      setError('Harap selesaikan verifikasi CAPTCHA.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      setLoading(false)
      return
    }

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role,
        nimOrUsername,
        password,
        turnstileToken,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      router.push('/login?message=Registrasi berhasil. Silakan cek email untuk verifikasi.')
    } else {
      setError(data.error || 'Terjadi kesalahan.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Daftar UPer.li
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Buat akun untuk mulai membuat short link
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-gray-700">Peran</label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  id="student"
                  name="role"
                  type="radio"
                  value="STUDENT"
                  checked={role === 'STUDENT'}
                  onChange={() => setRole('STUDENT')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="student" className="ml-3 block text-sm font-medium text-gray-700">
                  Mahasiswa
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="staff"
                  name="role"
                  type="radio"
                  value="STAFF"
                  checked={role === 'STAFF'}
                  onChange={() => setRole('STAFF')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="staff" className="ml-3 block text-sm font-medium text-gray-700">
                  Dosen/Staff
                </label>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="nimOrUsername" className="sr-only">
              {role === 'STUDENT' ? 'NIM' : 'Username'}
            </label>
            <input
              id="nimOrUsername"
              name="nimOrUsername"
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder={role === 'STUDENT' ? 'NIM' : 'Username'}
              value={nimOrUsername}
              onChange={(e) => setNimOrUsername(e.target.value)}
            />
            {nimOrUsername && (
              <p className="mt-1 text-sm text-gray-500">
                Email: {emailPreview}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="sr-only">
              Konfirmasi Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Konfirmasi Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-center">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
              onSuccess={setTurnstileToken}
              onError={() => setTurnstileToken('')}
              onExpire={() => setTurnstileToken('')}
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
              {loading ? 'Mendaftarkan...' : 'Daftar'}
            </button>
          </div>

          <div className="text-center">
            <a href="/login" className="text-blue-600 hover:text-blue-500">
              Sudah punya akun? Masuk di sini
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}