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

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Logo + Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <span className="text-xl font-bold text-gray-900">UPer.li</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/account"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                Akun
              </Link>
            </div>
          </div>

          {/* Right side: Desktop User Info & Logout */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-600 font-medium truncate max-w-xs">
              {session.user?.email}
            </span>
            <LogoutButton className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300" />
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-2">
            <Link
              href="/dashboard"
              onClick={closeMobileMenu}
              className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/account"
              onClick={closeMobileMenu}
              className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              Akun
            </Link>
          </div>
          <div className="px-4 py-3 border-t border-gray-200 space-y-3">
            <div className="text-sm font-medium text-gray-900 break-words">
              {session.user?.email}
            </div>
            <div onClick={closeMobileMenu}>
              <LogoutButton className="w-full px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300" />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}