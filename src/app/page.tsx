import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-grow flex flex-col items-center justify-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          UPer.li
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md text-center">
          URL Shortener Eksklusif untuk Civitas Universitas Pertamina
        </p>
        <div className="space-x-4">
          <a
            href="https://app.uper.li/register"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Daftar
          </a>
          <a
            href="https://app.uper.li/login"
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition"
          >
            Masuk
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
