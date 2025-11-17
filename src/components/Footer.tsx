export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-12 sm:mt-16">
      <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm sm:text-base text-gray-500 mb-4 md:mb-0">
            <a
              href="https://app.uper.li"
              className="text-sm sm:text-base text-gray-500 hover:text-gray-900 transition-colors"
            >
              © 2025 UPer.li
            </a>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6 lg:space-x-8">
            <a
              href="https://app.uper.li/terms"
              className="text-sm sm:text-base text-gray-500 hover:text-gray-900 transition-colors text-center"
            >
              Syarat dan Ketentuan
            </a>
            <a
              href="https://app.uper.li/privacy"
              className="text-sm sm:text-base text-gray-500 hover:text-gray-900 transition-colors text-center"
            >
              Kebijakan Privasi
            </a>
            <a
              href="https://app.uper.li/contact"
              className="text-sm sm:text-base text-gray-500 hover:text-gray-900 transition-colors text-center"
            >
              Hubungi Kami
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}