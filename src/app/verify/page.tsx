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
    <div className="min-h-screen gradient-bg flex flex-col">
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="mb-8">
            <button
              onClick={() => router.push('/register')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Pendaftaran
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Verifikasi Email
              </h2>
              <p className="text-base text-gray-600">
                Masukkan kode verifikasi yang dikirim ke email Anda
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
                  Kode Verifikasi
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  maxLength={6}
                  className="appearance-none rounded-xl block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base text-center text-2xl tracking-widest"
                  placeholder="ABC123"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replaceAll(/[^a-zA-Z0-9]/g, '').toLowerCase())}
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
                  disabled={loading || code.length !== 6}
                  className="w-full flex justify-center items-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl min-h-[52px]"
                >
                  {loading ? 'Memverifikasi...' : 'Verifikasi'}
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