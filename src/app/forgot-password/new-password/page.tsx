'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function NewPasswordPage() {
    const [code, setCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const nimOrUsername = localStorage.getItem('reset_nimOrUsername')
        if (!nimOrUsername) {
            router.push('/forgot-password')
        }
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        const nimOrUsername = localStorage.getItem('reset_nimOrUsername')

        if (!nimOrUsername) {
            setError('Sesi kadaluarsa. Silakan ulangi proses lupa password.')
            setLoading(false)
            return
        }

        if (newPassword !== confirmPassword) {
            setError('Password tidak cocok.')
            setLoading(false)
            return
        }

        if (newPassword.length < 6) {
            setError('Password minimal 6 karakter.')
            setLoading(false)
            return
        }

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nimOrUsername,
                    code,
                    newPassword,
                    confirmPassword,
                }),
            })

            const data = await response.json()

            if (response.ok) {
                setSuccess(data.message)
                localStorage.removeItem('reset_nimOrUsername')
                // Redirect after a short delay
                setTimeout(() => {
                    router.push('/login?message=Password berhasil diubah. Silakan login.')
                }, 2000)
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
                        <Link href="/forgot-password" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Kembali
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                Buat Password Baru
                            </h2>
                            <p className="text-base text-gray-600">
                                Masukkan kode verifikasi dari email dan password baru Anda.
                            </p>
                        </div>

                        {success ? (
                            <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
                                <p className="text-green-800 font-medium mb-4">{success}</p>
                                <Link href="/login" className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                    Ke Halaman Login
                                </Link>
                            </div>
                        ) : (
                            <form className="space-y-5" onSubmit={handleSubmit}>
                                <div>
                                    <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Kode Verifikasi (6 Digit)
                                    </label>
                                    <input
                                        id="code"
                                        name="code"
                                        type="text"
                                        required
                                        maxLength={6}
                                        className="appearance-none rounded-xl block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base text-center tracking-widest text-2xl"
                                        placeholder="000000"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Password Baru
                                    </label>
                                    <input
                                        id="newPassword"
                                        name="newPassword"
                                        type="password"
                                        required
                                        className="appearance-none rounded-xl block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                                        placeholder="Minimal 6 karakter"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
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
                                        placeholder="Ulangi password baru"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                                        {loading ? 'Memproses...' : 'Reset Password'}
                                    </button>
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
