import { useState } from 'react'

export default function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        if (newPassword !== confirmPassword) {
            setError('Konfirmasi password tidak cocok')
            setLoading(false)
            return
        }

        if (newPassword.length < 8) {
            setError('Password baru minimal 8 karakter')
            setLoading(false)
            return
        }

        try {
            const response = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            })

            const data = await response.json()

            if (response.ok) {
                setSuccess(data.message)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            } else {
                setError(data.error || 'Terjadi kesalahan')
            }
        } catch {
            setError('Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
            <div className="px-8 py-8 sm:p-8">
                <h3 className="text-2xl leading-6 font-semibold text-gray-900 mb-8">
                    Ubah Password
                </h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label
                            htmlFor="current-password"
                            className="block text-base font-medium text-gray-700"
                        >
                            Password Saat Ini
                        </label>
                        <div className="mt-2">
                            <input
                                type="password"
                                id="current-password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="new-password"
                            className="block text-base font-medium text-gray-700"
                        >
                            Password Baru
                        </label>
                        <div className="mt-2">
                            <input
                                type="password"
                                id="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="confirm-password"
                            className="block text-base font-medium text-gray-700"
                        >
                            Konfirmasi Password Baru
                        </label>
                        <div className="mt-2">
                            <input
                                type="password"
                                id="confirm-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                            />
                        </div>
                    </div>

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

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
