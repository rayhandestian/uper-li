import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-gray-500">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              © 2025 UPer.li
            </Link>
          </div>
          <nav className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <Link
              href="/terms"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              Syarat dan Ketentuan
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              Kebijakan Privasi
            </Link>
            <Link
              href="/contact"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              Hubungi Kami
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}