import Link from 'next/link'
import Footer from '@/components/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center px-4 py-2 mb-8 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
            ← Kembali ke Beranda
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Syarat dan Ketentuan
          </h1>
          <p className="text-gray-600 mb-8">
            Terakhir diperbarui: 19 November 2025
          </p>

          <div className="prose prose-lg prose-blue max-w-none text-gray-700">
            <p className="lead">
              Selamat datang di UPer.li. Harap baca Syarat dan Ketentuan ini dengan saksama sebelum menggunakan layanan kami.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Pendahuluan</h2>
            <p>
              UPer.li (&ldquo;Layanan&rdquo;) adalah layanan pemendek tautan (URL shortener) eksklusif yang disediakan untuk komunitas Universitas Pertamina. Dengan mengakses atau menggunakan Layanan ini, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari syarat ini, Anda tidak diperkenankan menggunakan Layanan kami.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Kelayakan Pengguna</h2>
            <p>
              Layanan ini hanya tersedia untuk:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Mahasiswa aktif Universitas Pertamina.</li>
              <li>Dosen dan Staf Universitas Pertamina.</li>
              <li>Alumni Universitas Pertamina (dengan akses terbatas).</li>
            </ul>
            <p>
              Anda harus memiliki alamat email resmi Universitas Pertamina atau kredensial yang valid (NIM/username) untuk membuat akun dan menggunakan fitur lengkap Layanan.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Akun dan Keamanan</h2>
            <p>
              Anda bertanggung jawab untuk menjaga kerahasiaan kata sandi dan akun Anda. Anda setuju untuk:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Memberikan informasi yang akurat dan lengkap saat pendaftaran.</li>
              <li>Bertanggung jawab penuh atas semua aktivitas yang terjadi di bawah akun Anda.</li>
              <li>Segera memberi tahu kami jika ada penggunaan akun tanpa izin atau pelanggaran keamanan lainnya.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Penggunaan yang Dilarang</h2>
            <p>
              Anda setuju untuk tidak menggunakan Layanan untuk tujuan apa pun yang melanggar hukum atau dilarang oleh Syarat ini. Anda tidak boleh membuat tautan yang mengarah ke:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Konten yang melanggar hukum, berbahaya, mengancam, melecehkan, memfitnah, atau penuh kebencian.</li>
              <li>Materi pornografi atau konten dewasa.</li>
              <li>Situs phishing, malware, virus, atau kode berbahaya lainnya.</li>
              <li>Konten yang melanggar hak kekayaan intelektual pihak lain.</li>
              <li>Spam atau promosi komersial yang tidak diinginkan.</li>
            </ul>
            <p>
              Kami menggunakan layanan pihak ketiga (seperti Google Safe Browsing) untuk memindai tautan berbahaya. Pelanggaran terhadap ketentuan ini dapat mengakibatkan penangguhan atau penghapusan akun Anda secara permanen tanpa pemberitahuan sebelumnya.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Hak Kekayaan Intelektual</h2>
            <p>
              Layanan dan konten aslinya (tidak termasuk konten yang disediakan oleh pengguna), fitur, dan fungsionalitas adalah dan akan tetap menjadi milik eksklusif UPer.li dan pemberi lisensinya.
            </p>
            <p className="mt-2">
              Dengan membuat tautan pendek, Anda memberikan kami lisensi non-eksklusif, bebas royalti, untuk menggunakan, menyalin, dan menampilkan tautan tersebut sehubungan dengan penyediaan Layanan.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Penolakan Jaminan (Disclaimer)</h2>
            <p>
              Layanan disediakan atas dasar &ldquo;sebagaimana adanya&rdquo; (AS IS) dan &ldquo;sebagaimana tersedia&rdquo; (AS AVAILABLE). UPer.li tidak memberikan jaminan bahwa Layanan akan tidak terganggu, aman, atau bebas dari kesalahan. Kami tidak menjamin keakuratan atau keandalan hasil apa pun yang diperoleh dari penggunaan Layanan.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Batasan Tanggung Jawab</h2>
            <p>
              Sejauh diizinkan oleh hukum yang berlaku, UPer.li, pengelola, atau Universitas Pertamina tidak akan bertanggung jawab atas kerugian tidak langsung, insidental, khusus, konsekuensial, atau hukuman, termasuk namun tidak terbatas pada, hilangnya keuntungan, data, penggunaan, goodwill, atau kerugian tidak berwujud lainnya, yang diakibatkan oleh:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Akses Anda ke atau penggunaan atau ketidakmampuan untuk mengakses atau menggunakan Layanan;</li>
              <li>Perilaku atau konten pihak ketiga mana pun pada Layanan;</li>
              <li>Konten apa pun yang diperoleh dari Layanan; dan</li>
              <li>Akses, penggunaan, atau pengubahan transmisi atau konten Anda yang tidak sah.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Tautan ke Situs Web Lain</h2>
            <p>
              Layanan kami berisi tautan ke situs web atau layanan pihak ketiga yang tidak dimiliki atau dikendalikan oleh UPer.li. Kami tidak memiliki kendali atas, dan tidak bertanggung jawab atas, konten, kebijakan privasi, atau praktik situs web atau layanan pihak ketiga mana pun.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Hukum yang Berlaku</h2>
            <p>
              Syarat dan Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum Republik Indonesia, tanpa memperhatikan pertentangan ketentuan hukum.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Perubahan Syarat</h2>
            <p>
              Kami berhak, atas kebijakan kami sendiri, untuk mengubah atau mengganti Syarat ini kapan saja. Jika revisi tersebut bersifat material, kami akan mencoba memberikan pemberitahuan setidaknya 30 hari sebelum syarat baru berlaku. Apa yang merupakan perubahan material akan ditentukan atas kebijakan kami sendiri.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Kontak</h2>
            <p>
              Jika Anda memiliki pertanyaan tentang Syarat ini, silakan hubungi kami di:
            </p>
            <ul className="list-none pl-0 mb-4">
              <li>Email: <a href="mailto:contact@uper.li" className="text-blue-600 hover:underline">contact@uper.li</a></li>
              <li>Dukungan: <a href="mailto:support@uper.li" className="text-blue-600 hover:underline">support@uper.li</a></li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}