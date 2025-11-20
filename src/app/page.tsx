'use client'

import { useState } from 'react'
import Footer from '@/components/Footer'
import LogoutButton from '@/components/LogoutButton'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function Home() {
  const { data: session } = useSession()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      title: 'Shortlink Custom',
      description: 'Buat link pendek dengan alias custom atau biarkan sistem generate otomatis'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      ),
      title: 'QR Code Generator',
      description: 'Generate QR code untuk setiap link yang kamu buat, siap untuk dicetak atau dibagikan'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Analytics & Tracking',
      description: 'Monitor performa link dengan tracking jumlah klik dan waktu kunjungan terakhir'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      title: 'Dashboard Management',
      description: 'Kelola semua link kamu dalam satu dashboard yang clean, modern, dan mudah digunakan'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: 'Password Protection',
      description: 'Lindungi link sensitif dengan password untuk keamanan tambahan'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Eksklusif Civitas UP',
      description: 'Dibuat khusus untuk komunitas Universitas Pertamina dengan domain uper.li yang memorable'
    }
  ]

  const steps = [
    {
      number: '01',
      title: 'Daftar Akun',
      description: 'Registrasi menggunakan email Universitas Pertamina untuk mendapatkan akses'
    },
    {
      number: '02',
      title: 'Buat Shortlink',
      description: 'Input URL panjang, pilih custom alias atau biarkan sistem generate otomatis'
    },
    {
      number: '03',
      title: 'Track & Share',
      description: 'Monitor klik dan performa link kamu, download QR code, dan bagikan'
    }
  ]

  const benefits = [
    {
      title: 'Domain Memorable',
      description: 'Domain uper.li yang singkat dan mudah diingat, sempurna untuk kampus Universitas Pertamina'
    },
    {
      title: 'Profesional & Kredibel',
      description: 'Tingkatkan kredibilitas link dengan domain resmi kampus daripada shortener umum'
    },
    {
      title: 'Free untuk Civitas',
      description: 'Layanan gratis untuk seluruh civitas Universitas Pertamina dengan kuota bulanan yang generous'
    },
    {
      title: 'Data Privacy',
      description: 'Link dan analytics kamu bersifat private dan hanya bisa diakses oleh kamu sendiri'
    }
  ]

  const faqs = [
    {
      question: 'Apa itu UPer.li?',
      answer: 'UPer.li adalah layanan URL shortener eksklusif untuk civitas Universitas Pertamina. Platform ini memungkinkan kamu membuat link pendek dengan domain uper.li, lengkap dengan fitur analytics, QR code generator, dan dashboard management.'
    },
    {
      question: 'Siapa yang bisa menggunakan UPer.li?',
      answer: 'Layanan ini eksklusif untuk seluruh civitas Universitas Pertamina, termasuk mahasiswa, dosen, staff, dan alumni. Kamu perlu mendaftar menggunakan email Universitas Pertamina untuk mendapatkan akses.'
    },
    {
      question: 'Apakah UPer.li gratis?',
      answer: 'Ya, UPer.li sepenuhnya gratis untuk semua civitas Universitas Pertamina. Mahasiswa mendapat kuota 5 link per bulan, sementara dosen/staff mendapat 10 link per bulan. Kuota ini direset setiap bulannya.'
    },
    {
      question: 'Bagaimana cara membuat shortlink?',
      answer: 'Setelah login ke dashboard, masukkan URL panjang yang ingin kamu perpendek. Kamu bisa memilih custom alias atau biarkan sistem generate secara otomatis. Link pendek kamu akan langsung siap digunakan dan dilengkapi dengan QR code.'
    },
    {
      question: 'Apakah data saya aman?',
      answer: 'Ya, kami menggunakan NextAuth untuk autentikasi yang aman. Link dan data analytics kamu bersifat private dan hanya bisa diakses oleh kamu. Kamu juga bisa menambahkan password protection untuk link yang sensitif.'
    },
    {
      question: 'Apa yang membedakan UPer.li dengan shortener lainnya?',
      answer: 'UPer.li menggunakan domain khusus (uper.li) yang lebih profesional dan kredibel untuk lingkungan akademik Universitas Pertamina. Dilengkapi dengan analytics, QR code generator otomatis, password protection, dan dashboard yang modern. Plus, eksklusif untuk komunitas kampus kita!'
    }
  ]

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side: Logo + Navigation */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2 group">
                <span className="text-xl font-bold text-gray-900">UPer.li</span>
              </Link>

              {/* Desktop Navigation - Left Side */}
              <div className="hidden md:flex items-center space-x-1">
                {session && (
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  >
                    Dashboard
                  </Link>
                )}
              </div>
            </div>

            {/* Right side: Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {session ? (
                <>
                  <span className="text-sm text-gray-600 font-medium truncate max-w-xs">
                    {session.user?.email}
                  </span>
                  <LogoutButton className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300" />
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Daftar
                  </Link>
                </>
              )}
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
              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  >
                    Dashboard
                  </Link>
                  <div className="pt-2 border-t border-gray-100 mt-2">
                    <div className="px-4 py-2 text-sm font-medium text-gray-900 break-words">
                      {session.user?.email}
                    </div>
                    <div onClick={closeMobileMenu}>
                      <LogoutButton className="w-full px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 text-center"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMobileMenu}
                    className="block px-4 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 shadow-md text-center"
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 py-20">
        <div className="text-center max-w-4xl mx-auto fade-in">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
            UPer.li
          </h1>
          <p className="text-xl sm:text-2xl lg:text-3xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed font-light">
            URL Shortener Eksklusif untuk Civitas Universitas Pertamina
          </p>
          <p className="text-base sm:text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            Buat link pendek yang profesional, track analytics, dan kelola semua link kamu dalam satu dashboard modern.
          </p>
          {session ? (
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link
                href="/dashboard"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 min-h-[52px] w-full sm:w-auto"
              >
                <span>Dashboard</span>
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <LogoutButton className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-red-600 bg-white rounded-xl hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-md hover:shadow-lg border-2 border-red-200 hover:border-red-300 min-h-[52px] w-full sm:w-auto" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link
                href="/register"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 min-h-[52px] w-full sm:w-auto"
              >
                <span>Mulai Gratis</span>
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-gray-700 bg-white rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg border-2 border-gray-200 hover:border-gray-300 min-h-[52px] w-full sm:w-auto"
              >
                Masuk
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 slide-up">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Semua yang kamu butuhkan untuk mengelola dan track link dengan profesional
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card p-8 hover:scale-105 transition-transform duration-200"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 slide-up">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Cara Kerja
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tiga langkah mudah untuk mulai membuat shortlink profesional
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="text-center slide-up" style={{ animationDelay: `${index * 150}ms` }}>
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-lg">
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-600 to-blue-300" style={{ marginLeft: '2.5rem' }} />
                  )}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 slide-up">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Mengapa UPer.li?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Solusi shortlink yang dibuat khusus untuk kebutuhan kampus
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex gap-6 p-8 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 hover:border-blue-300 transition-all duration-200"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 slide-up">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Pertanyaan Umum
            </h2>
            <p className="text-lg text-gray-600">
              Jawaban untuk pertanyaan yang sering ditanyakan
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:border-gray-300"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <span className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-6 h-6 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${openFaq === index ? 'max-h-96' : 'max-h-0'
                    }`}
                >
                  <div className="px-8 pb-6 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
