'use client'

import { useState, useEffect } from 'react'

interface Link {
  id: string
  shortUrl: string
  longUrl: string
}

export default function QRPage() {
  const [links, setLinks] = useState<Link[]>([])
  const [selectedLink, setSelectedLink] = useState<string>('')
  const [qrCode, setQrCode] = useState<string>('')

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    const response = await fetch('/api/links')
    if (response.ok) {
      const data = await response.json()
      setLinks(data)
    }
  }

  const generateQR = async () => {
    if (!selectedLink) return

    const link = links.find(l => l.id === selectedLink)
    if (!link) return

    const url = `https://uper.link/${link.shortUrl}`
    // In a real app, use a QR code library or API
    // For demo, just show the URL
    setQrCode(url)
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">QR Code</h1>
        <p className="mt-1 text-sm text-gray-600">
          Generate QR code untuk short link Anda
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="link" className="block text-sm font-medium text-gray-700">
              Pilih Link
            </label>
            <select
              id="link"
              value={selectedLink}
              onChange={(e) => setSelectedLink(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">Pilih link...</option>
              {links.map((link) => (
                <option key={link.id} value={link.id}>
                  uper.link/{link.shortUrl} - {link.longUrl}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generateQR}
            disabled={!selectedLink}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Generate QR Code
          </button>

          {qrCode && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">QR Code untuk: {qrCode}</p>
              <div className="bg-gray-100 p-4 rounded-md text-center">
                <p className="text-sm text-gray-500">
                  (QR Code akan ditampilkan di sini dengan library seperti qrcode.react)
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  URL: {qrCode}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}