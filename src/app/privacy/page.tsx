import Link from 'next/link'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center px-4 py-2 mb-8 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
            ← Kembali ke Beranda
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Kebijakan Privasi
          </h1>
          <p className="text-gray-600 mb-8">
            Terakhir diperbarui: 19 November 2025
          </p>

          <div className="prose prose-lg prose-blue max-w-none text-gray-700">
            <p className="lead">
              Di UPer.li, kami sangat menghargai privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda sesuai dengan Undang-Undang Pelindungan Data Pribadi (UU PDP) Republik Indonesia.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Informasi yang Kami Kumpulkan</h2>
            <p>
              Kami mengumpulkan beberapa jenis informasi untuk menyediakan dan meningkatkan layanan kami:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2">a. Informasi Pribadi</h3>
            <p>
              Saat Anda mendaftar akun, kami mengumpulkan:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Nama Lengkap</li>
              <li>Alamat Email (Email resmi Universitas Pertamina)</li>
              <li>NIM atau Username</li>
              <li>Peran (Mahasiswa, Dosen, Staf)</li>
              <li>Kata Sandi (disimpan dalam bentuk terenkripsi/hashed)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2">b. Informasi Penggunaan dan Teknis</h3>
            <p>
              Saat Anda menggunakan layanan kami, kami secara otomatis mengumpulkan:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Log aktivitas (pembuatan tautan, pengeditan)</li>
              <li>Alamat IP (untuk keamanan dan pencegahan penyalahgunaan)</li>
              <li>Informasi perangkat dan browser (User Agent)</li>
              <li>Statistik klik tautan (jumlah klik, waktu akses, lokasi geografis kasar)</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Cara Kami Menggunakan Informasi</h2>
            <p>
              Kami menggunakan informasi yang dikumpulkan untuk:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Menyediakan, mengoperasikan, dan memelihara layanan kami.</li>
              <li>Memverifikasi identitas dan kelayakan Anda sebagai anggota komunitas Universitas Pertamina.</li>
              <li>Meningkatkan keamanan dan mencegah penipuan atau penyalahgunaan.</li>
              <li>Memantau penggunaan layanan untuk analisis dan perbaikan kinerja.</li>
              <li>Mengirimkan pemberitahuan penting terkait akun atau layanan (misalnya: kode verifikasi 2FA).</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Pembagian Informasi (Pihak Ketiga)</h2>
            <p>
              Kami tidak menjual data pribadi Anda. Namun, kami membagikan data dengan penyedia layanan pihak ketiga (Prosesor Data) yang membantu kami mengoperasikan layanan ini:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Vercel</strong>: Penyedia hosting dan analitik web.</li>
              <li><strong>Neon</strong>: Penyedia database untuk penyimpanan data akun dan tautan.</li>
              <li><strong>Cloudflare</strong>: Layanan keamanan (Turnstile) dan kinerja jaringan.</li>
              <li><strong>Google Safe Browsing</strong>: Layanan keamanan untuk memindai tautan berbahaya.</li>
              <li><strong>Brevo</strong>: Layanan pengiriman email transaksional (seperti kode OTP).</li>
            </ul>
            <p>
              Pihak ketiga ini hanya memiliki akses ke informasi Anda untuk melakukan tugas-tugas ini atas nama kami dan diwajibkan untuk tidak mengungkapkannya atau menggunakannya untuk tujuan lain.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Hak Pengguna</h2>
            <p>
              Sesuai dengan UU PDP, Anda memiliki hak untuk:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Mengakses data pribadi yang kami simpan tentang Anda.</li>
              <li>Meminta perbaikan data yang tidak akurat.</li>
              <li>Meminta penghapusan data pribadi Anda (Hak untuk Dilupakan), kecuali jika kami diwajibkan oleh hukum untuk menyimpannya.</li>
              <li>Menarik persetujuan penggunaan data Anda.</li>
            </ul>
            <p>
              Untuk menggunakan hak-hak ini, silakan hubungi kami melalui email dukungan.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Cookies</h2>
            <p>
              Kami menggunakan cookies untuk:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Mempertahankan sesi login Anda (Authentication).</li>
              <li>Menganalisis lalu lintas situs web (Analytics).</li>
              <li>Meningkatkan keamanan (Security).</li>
            </ul>
            <p>
              Anda dapat mengatur browser Anda untuk menolak semua cookies, namun beberapa fitur layanan mungkin tidak berfungsi dengan baik.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Keamanan Data</h2>
            <p>
              Kami mengutamakan keamanan data Anda. Kami menggunakan enkripsi standar industri (seperti bcrypt untuk kata sandi) dan protokol HTTPS untuk melindungi transmisi data. Namun, perlu diingat bahwa tidak ada metode transmisi melalui internet atau penyimpanan elektronik yang 100% aman.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Perubahan Kebijakan</h2>
            <p>
              Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan akan diberitahukan melalui email atau pengumuman di situs web. Kami menyarankan Anda untuk meninjau halaman ini secara berkala.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Kontak</h2>
            <p>
              Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami:
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