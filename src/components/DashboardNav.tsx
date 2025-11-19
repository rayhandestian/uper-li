'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Session } from 'next-auth'
import LogoutButton from '@/components/LogoutButton'

interface DashboardNavProps {
  session: Session
}

export default function DashboardNav({ session }: DashboardNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="inline-flex items-center px-4 py-2 border-2 border-gray-200 shadow-sm text-sm font-bold rounded-lg text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
                UPer.li
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              <Link href="/dashboard" className="border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 inline-flex items-center px-4 py-2 border-b-2 text-sm font-semibold transition-all rounded-t-lg">
                Beranda
              </Link>
              <Link href="/dashboard/links" className="border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 inline-flex items-center px-4 py-2 border-b-2 text-sm font-semibold transition-all rounded-t-lg">
                Link
              </Link>
              <Link href="/dashboard/analytics" className="border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 inline-flex items-center px-4 py-2 border-b-2 text-sm font-semibold transition-all rounded-t-lg">
                Analitik
              </Link>
              <Link href="/dashboard/qr" className="border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 inline-flex items-center px-4 py-2 border-b-2 text-sm font-semibold transition-all rounded-t-lg">
                QR Code
              </Link>
              <Link href="/dashboard/account" className="border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 inline-flex items-center px-4 py-2 border-b-2 text-sm font-semibold transition-all rounded-t-lg">
                Akun
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
            <span className="text-sm text-gray-600 font-medium truncate max-w-xs">
              {session.user?.email}
            </span>
            <LogoutButton className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm font-semibold px-4 py-2 rounded-lg transition-all" />
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all"
            >
              <span className="sr-only">Open main menu</span>
              <svg className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden border-t border-gray-200 bg-gray-50`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link href="/dashboard" className="text-gray-900 hover:bg-white block px-4 py-3 rounded-lg text-base font-semibold transition-all" onClick={() => setMobileMenuOpen(false)}>
            Beranda
          </Link>
          <Link href="/dashboard/links" className="text-gray-900 hover:bg-white block px-4 py-3 rounded-lg text-base font-semibold transition-all" onClick={() => setMobileMenuOpen(false)}>
            Link
          </Link>
          <Link href="/dashboard/analytics" className="text-gray-900 hover:bg-white block px-4 py-3 rounded-lg text-base font-semibold transition-all" onClick={() => setMobileMenuOpen(false)}>
            Analitik
          </Link>
          <Link href="/dashboard/qr" className="text-gray-900 hover:bg-white block px-4 py-3 rounded-lg text-base font-semibold transition-all" onClick={() => setMobileMenuOpen(false)}>
            QR Code
          </Link>
          <Link href="/dashboard/account" className="text-gray-900 hover:bg-white block px-4 py-3 rounded-lg text-base font-semibold transition-all" onClick={() => setMobileMenuOpen(false)}>
            Akun
          </Link>
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200 bg-white">
          <div className="px-4 space-y-3">
            <div className="text-sm font-medium text-gray-900 break-words">{session.user?.email}</div>
            <LogoutButton className="w-full text-left text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold px-4 py-2 rounded-lg transition-all" />
          </div>
        </div>
      </div>
    </nav>
  )
}