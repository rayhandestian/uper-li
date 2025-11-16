'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'

export default function LogoutButton({ className = "text-sm text-gray-600 hover:text-gray-800" }: { className?: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        Keluar
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Konfirmasi Keluar
            </h2>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin keluar?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Tidak
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Ya
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}