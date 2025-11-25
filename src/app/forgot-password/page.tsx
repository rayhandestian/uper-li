'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Turnstile } from '@marsidev/react-turnstile'
import Footer from '@/components/Footer'

export default function ForgotPasswordPage() {
    const [nimOrUsername, setNimOrUsername] = useState('')
    const [turnstileToken, setTurnstileToken] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const isValidNim = !nimOrUsername || /^[a-zA-Z0-9._-]+$/.test(nimOrUsername)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (!turnstileToken) {
            setError('Harap selesaikan verifikasi CAPTCHA.')
            setLoading(false)
            return
        }

        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nimOrUsername,
                    turnstileToken,
                }),
            })

            const data = await response.json()

            if (response.ok) {
                // Store nimOrUsername for the next step
                localStorage.setItem('reset_nimOrUsername', nimOrUsername)
                router.push('/forgot-password/new-password')
            } else {
                setError(data.error || 'Terjadi kesalahan.')
            }
        } catch {
            setError('Terjadi kesalahan jaringan.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen gradient-bg flex flex-col">
            <main className="flex-grow flex items-center justify-center px-4 py-12">
                <div className="max-w-md w-full">
                    <div className="mb-8">
                        <Link href="/login" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Kembali ke Login
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                Lupa Password?
                            </h2>
                            <p className="text-base text-gray-600">
                                Masukkan NIM atau Username Anda untuk mereset password.
                            </p>
                        </div>

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
                                    className={`appearance-none rounded-xl block w-full px-4 py-3 border ${!isValidNim ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-base`}
                                    placeholder="123456789 / john.doe"
                                    value={nimOrUsername}
                                    onChange={(e) => setNimOrUsername(e.target.value)}
                                />
                                {!isValidNim && (
                                    <p className="mt-1 text-sm text-red-600">
                                        Hanya huruf, angka, titik (.), garis bawah (_), dan minus (-) yang diperbolehkan
                                    </p>
                                )}
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
                                    disabled={loading || !isValidNim || !turnstileToken}
                                    className="w-full flex justify-center items-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl min-h-[52px]"
                                >
                                    {loading ? 'Mengirim...' : 'Kirim Kode'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
