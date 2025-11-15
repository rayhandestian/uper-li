import Footer from '@/components/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Syarat dan Ketentuan UPer.li
        </h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-800 mb-6">
            Selamat datang di UPer.li, layanan URL shortener eksklusif untuk Civitas Universitas Pertamina.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Penerimaan Syarat</h2>
          <p>
            Dengan menggunakan UPer.li, Anda menyetujui syarat dan ketentuan ini. Jika Anda tidak setuju, harap jangan gunakan layanan ini.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Penggunaan Layanan</h2>
          <p>
            Layanan ini hanya untuk mahasiswa, dosen, dan staff Universitas Pertamina dengan email resmi universitas.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Batasan Penggunaan</h2>
          <p>
            Dilarang membuat link yang mengarah ke konten ilegal, berbahaya, atau melanggar hak cipta.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Privasi</h2>
          <p>
            Kami menghormati privasi Anda. Lihat Kebijakan Privasi untuk detail lebih lanjut.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Penolakan Tanggung Jawab</h2>
          <p>
            UPer.li tidak bertanggung jawab atas konten yang di-link oleh pengguna.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Perubahan Syarat</h2>
          <p>
            Kami dapat mengubah syarat ini kapan saja. Penggunaan berkelanjutan berarti Anda menerima perubahan.
          </p>

          <p className="mt-8 text-sm text-gray-600">
            Terakhir diperbarui: November 2025
          </p>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}