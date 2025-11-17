export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto py-12 px-6 sm:px-8 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-base text-gray-500 mb-6 md:mb-0">
            <a
              href="https://app.uper.li"
              className="text-base text-gray-500 hover:text-gray-900 transition-colors"
            >
              © 2025 UPer.li
            </a>
          </div>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8">
            <a
              href="https://app.uper.li/terms"
              className="text-base text-gray-500 hover:text-gray-900 transition-colors"
            >
              Syarat dan Ketentuan
            </a>
            <a
              href="https://app.uper.li/privacy"
              className="text-base text-gray-500 hover:text-gray-900 transition-colors"
            >
              Kebijakan Privasi
            </a>
            <a
              href="https://app.uper.li/contact"
              className="text-base text-gray-500 hover:text-gray-900 transition-colors"
            >
              Hubungi Kami
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}