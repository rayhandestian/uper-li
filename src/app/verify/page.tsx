'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Footer from '@/components/Footer'

export default function VerifyPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if credentials are stored
    const nimOrUsername = localStorage.getItem('verify_nimOrUsername')
    const password = localStorage.getItem('verify_password')
    if (!nimOrUsername || !password) {
      router.push('/register')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const nimOrUsername = localStorage.getItem('verify_nimOrUsername')
    const password = localStorage.getItem('verify_password')

    if (!nimOrUsername || !password) {
      setError('Sesi verifikasi telah berakhir. Silakan daftar ulang.')
      setLoading(false)
      return
    }

    const response = await fetch('/api/verify-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    })

    const data = await response.json()

    if (response.ok) {
      // Verification successful, auto-login
      const result = await signIn('credentials', {
        nimOrUsername,
        password,
        redirect: false,
      })

      if (result?.ok) {
        // Clear stored credentials
        localStorage.removeItem('verify_nimOrUsername')
        localStorage.removeItem('verify_password')
        router.push('/dashboard')
      } else {
        setError('Verifikasi berhasil, tetapi gagal masuk. Silakan coba masuk manual.')
      }
    } else {
      setError(data.error || 'Kode verifikasi tidak valid.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Verifikasi Email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Masukkan kode verifikasi yang dikirim ke email Anda
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Kode Verifikasi
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                maxLength={6}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-2xl tracking-widest"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
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
                disabled={loading || code.length !== 6}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Memverifikasi...' : 'Verifikasi'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="text-blue-600 hover:text-blue-500"
              >
                Kembali ke Pendaftaran
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}