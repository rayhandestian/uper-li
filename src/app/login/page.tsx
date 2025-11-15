'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Turnstile } from '@marsidev/react-turnstile'

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
      setMessage(msg)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      router.push('/dashboard')
    } else {
      setError(data.error || 'Kode 2FA salah.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Masuk ke UPer.li
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {requires2FA
              ? 'Masukkan kode verifikasi 2FA dari email Anda'
              : 'Masukkan NIM/Username dan password Anda'
            }
          </p>
          {message && (
            <div className="mt-4 text-green-600 text-sm text-center">
              {message}
            </div>
          )}
        </div>

        {requires2FA ? (
          <form className="mt-8 space-y-6" onSubmit={handle2FASubmit}>
            <div>
              <label htmlFor="twoFactorCode" className="sr-only">
                Kode 2FA
              </label>
              <input
                id="twoFactorCode"
                name="twoFactorCode"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="000000"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                maxLength={6}
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
                className="text-blue-600 hover:text-blue-500"
              >
                Kembali ke login
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="nimOrUsername" className="sr-only">
                NIM/Username
              </label>
              <input
                id="nimOrUsername"
                name="nimOrUsername"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="NIM/Username"
                value={nimOrUsername}
                onChange={(e) => setNimOrUsername(e.target.value)}
              />
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
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
              {loading ? 'Sedang masuk...' : 'Masuk'}
            </button>
          </div>

          <div className="text-center">
            <a href="/register" className="text-blue-600 hover:text-blue-500">
              Belum punya akun? Daftar di sini
            </a>
          </div>
        </form>
        )}
      </div>
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