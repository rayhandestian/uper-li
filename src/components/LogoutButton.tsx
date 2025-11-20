'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { createPortal } from 'react-dom'

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

      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[100]">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 sm:p-8 transform transition-all duration-300 ease-out opacity-100 scale-100 relative z-10">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Konfirmasi Keluar
            </h3>
            <p className="text-base text-gray-600 mb-8">
              Apakah Anda yakin ingin keluar?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Tidak
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-3 text-base font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Ya
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}