export default function InactivePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            UPer.link
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Short URL ini sudah dinonaktifkan.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Hubungi pemilik link jika Anda membutuhkan akses.
          </p>
          <a
            href="/"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    </div>
  )
}