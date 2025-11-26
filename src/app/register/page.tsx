'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Turnstile } from '@marsidev/react-turnstile'
import Footer from '@/components/Footer'

export default function RegisterPage() {
  const [role, setRole] = useState<'STUDENT' | 'STAFF'>('STUDENT')
  const [nimOrUsername, setNimOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendingVerification, setResendingVerification] = useState(false)
  const router = useRouter()

  const emailPreview = role === 'STUDENT'
    ? `${nimOrUsername}@student.universitaspertamina.ac.id`
    : `${nimOrUsername}@universitaspertamina.ac.id`

  const isValidNim = !nimOrUsername || /^[a-zA-Z0-9._-]+$/.test(nimOrUsername)

  const handleResendVerification = async () => {
    setError('')
    setResendingVerification(true)

    try {
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nimOrUsername,
          
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store credentials and redirect to verify page
        localStorage.setItem('verify_nimOrUsername', nimOrUsername)
        localStorage.setItem('verify_password', password)
        router.push('/verify')
      } else {
        setError(data.error || 'Terjadi kesalahan saat mengirim ulang kode verifikasi.')
      }
    } catch {
      setError('Terjadi kesalahan saat mengirim ulang kode verifikasi.')
    }

    setResendingVerification(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!agreedToTerms) {
      setError('Anda harus menyetujui Syarat dan Ketentuan serta Kebijakan Privasi.')
      setLoading(false)
      return
    }

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
        agreedToTerms,
        turnstileToken,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      // Store credentials for verification page
      localStorage.setItem('verify_nimOrUsername', nimOrUsername)
      localStorage.setItem('verify_password', password)
      router.push('/verify')
    } else {
      // Check if this is an "email already registered" error
      if (data.error === 'Email sudah terdaftar.' && nimOrUsername && password) {
        setError('Email sudah terdaftar. Akun Anda mungkin perlu verifikasi email. Coba kirim ulang kode verifikasi?')
      } else {
        setError(data.error || 'Terjadi kesalahan.')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
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
                Daftar UPer.li
              </h2>
              <p className="text-base text-gray-600">
                Buat akun untuk mulai membuat short link
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Peran</label>
                <div className="space-y-2.5">
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer transition-all hover:border-blue-300 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                    <input
                      id="student"
                      name="role"
                      type="radio"
                      value="STUDENT"
                      checked={role === 'STUDENT'}
                      onChange={() => setRole('STUDENT')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Mahasiswa
                    </span>
                  </label>
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer transition-all hover:border-blue-300 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                    <input
                      id="staff"
                      name="role"
                      type="radio"
                      value="STAFF"
                      checked={role === 'STAFF'}
                      onChange={() => setRole('STAFF')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Dosen/Staff
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="nimOrUsername" className="block text-sm font-semibold text-gray-700 mb-2">
                  {role === 'STUDENT' ? 'NIM' : 'Username'}
                </label>
                <input
                  id="nimOrUsername"
                  name="nimOrUsername"
                  type="text"
                  required
                  className={`appearance-none rounded-xl block w-full px-4 py-3 border ${!isValidNim ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-base`}
                  placeholder={role === 'STUDENT' ? '123456789' : 'john.doe'}
                  value={nimOrUsername}
                  onChange={(e) => setNimOrUsername(e.target.value)}
                />
                {!isValidNim && (
                  <p className="mt-1 text-sm text-red-600">
                    Hanya huruf, angka, titik (.), garis bawah (_), dan minus (-) yang diperbolehkan
                  </p>
                )}
                {nimOrUsername && isValidNim && (
                  <p className="mt-2 text-sm text-gray-600">
                    Email: <span className="font-medium">{emailPreview}</span>
                  </p>
                )}
              </div>

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
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Konfirmasi Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="appearance-none rounded-xl block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                  placeholder="Ulangi password Anda"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                <input
                  id="agreedToTerms"
                  name="agreedToTerms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                />
                <label htmlFor="agreedToTerms" className="ml-3 text-sm text-gray-700">
                  Saya setuju dengan{' '}
                  <a href="https://app.uper.li/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium underline">
                    Syarat dan Ketentuan
                  </a>
                  {' '}serta{' '}
                  <a href="https://app.uper.li/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium underline">
                    Kebijakan Privasi
                  </a>
                </label>
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
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-red-800">{error}</p>
                    {error.includes('Email sudah terdaftar') && nimOrUsername && password && (
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendingVerification}
                        className="ml-3 flex-shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resendingVerification ? 'Mengirim...' : 'Kirim Ulang'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading || !isValidNim || !turnstileToken}
                  className="w-full flex justify-center items-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl min-h-[52px]"
                >
                  {loading ? 'Mendaftarkan...' : 'Daftar'}
                </button>
              </div>

              <div className="text-center">
                <a href="https://app.uper.li/login" className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                  Sudah punya akun? Masuk di sini
                </a>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
