export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Hubungi Kami
        </h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-600 mb-6">
            Jika Anda memiliki pertanyaan atau masalah dengan UPer.li, hubungi kami melalui:
          </p>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informasi Kontak</h2>
            <ul className="space-y-2 text-gray-700">
              <li>
                <strong>Email:</strong> support@uper.li
              </li>
              <li>
                <strong>Universitas:</strong> Universitas Pertamina
              </li>
              <li>
                <strong>Lokasi:</strong> Jakarta, Indonesia
              </li>
            </ul>
          </div>

          <p className="mt-6 text-gray-600">
            Kami akan berusaha menjawab pertanyaan Anda dalam 1-2 hari kerja.
          </p>
        </div>
      </div>
    </div>
  )
}