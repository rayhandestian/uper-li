'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Turnstile } from '@marsidev/react-turnstile'
import Footer from '@/components/Footer'

function LoginForm() {
  const [nimOrUsername, setNimOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const msg = searchParams.get('message')
    if (msg) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessage(msg)
    }

  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!turnstileToken) {
      setError('Harap selesaikan verifikasi CAPTCHA.')
      setLoading(false)
      return
    }

    const result = await signIn('credentials', {
      nimOrUsername,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('NIM/Username atau password salah.')
    } else if (result?.ok) {
      // Check if 2FA is required by looking at the session
      const sessionCheck = await fetch('/api/auth/session')
      const sessionData = await sessionCheck.json()

      if (sessionData?.user?.requires2FA) {
        setRequires2FA(true)
      } else {
        router.push('/dashboard')
      }
    }

    setLoading(false)
  }

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const response = await fetch('/api/2fa/verify-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: twoFactorCode }),
    })

    const data = await response.json()

    if (response.ok) {
      router.push('https://app.uper.li/dashboard')
    } else {
      setError(data.error || 'Kode 2FA salah.')
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
                Masuk ke UPer.li
              </h2>
              <p className="text-base text-gray-600">
                {requires2FA
                  ? 'Masukkan kode verifikasi 2FA dari email Anda'
                  : 'Masukkan NIM/Username dan password Anda'
                }
              </p>
              {message && (
                <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm text-green-800">{message}</p>
                </div>
              )}
            </div>

            {requires2FA ? (
              <form className="space-y-5" onSubmit={handle2FASubmit}>
                <div>
                  <label htmlFor="twoFactorCode" className="block text-sm font-semibold text-gray-700 mb-2">
                    Kode 2FA
                  </label>
                  <input
                    id="twoFactorCode"
                    name="twoFactorCode"
                    type="text"
                    required
                    className="appearance-none rounded-xl block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                    placeholder="Masukkan 6 digit kode"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    maxLength={6}
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    {loading ? 'Memverifikasi...' : 'Verifikasi 2FA'}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setRequires2FA(false)
                      setTwoFactorCode('')
                      setError('')
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                  >
                    Kembali ke login
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="nimOrUsername" className="block text-sm font-semibold text-gray-700 mb-2">
                    NIM/Username
                  </label>
                  <input
                    id="nimOrUsername"
                    name="nimOrUsername"
                    type="text"
                    required
                    className="appearance-none rounded-xl block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                    placeholder="123456789 atau john.doe"
                    value={nimOrUsername}
                    onChange={(e) => setNimOrUsername(e.target.value)}
                  />
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

                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Lupa password?
                  </Link>
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
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl min-h-[52px]"
                  >
                    {loading ? 'Sedang masuk...' : 'Masuk'}
                  </button>
                </div>

                <div className="text-center">
                  <a href="https://app.uper.li/register" className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                    Belum punya akun? Daftar di sini
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div>Loading...</div></div>}>
      <LoginForm />
    </Suspense>
  )
}