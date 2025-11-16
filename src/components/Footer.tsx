export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-500 mb-4 md:mb-0">
            © 2025 UPer.li
          </div>
          <div className="flex space-x-6">
            <a
              href="https://app.uper.li/terms"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Syarat dan Ketentuan
            </a>
            <a
              href="https://app.uper.li/privacy"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Kebijakan Privasi
            </a>
            <a
              href="https://app.uper.li/contact"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Hubungi Kami
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}