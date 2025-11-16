'use client'

import { useState, useEffect, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'

interface Link {
  id: string
  shortUrl: string
  longUrl: string
}

export default function QRPage() {
  const [links, setLinks] = useState<Link[]>([])
  const [selectedLink, setSelectedLink] = useState<string>('')
  const [qrCode, setQrCode] = useState<string>('')
  const qrRef = useRef<HTMLCanvasElement>(null)

  const fetchLinks = async () => {
    const response = await fetch('/api/links')
    if (response.ok) {
      const data = await response.json()
      setLinks(data.links)
    }
  }

  useEffect(() => {
    fetchLinks()
  }, [])

  const generateQR = async () => {
    if (!selectedLink) return

    const link = links.find(l => l.id === selectedLink)
    if (!link) return

    const url = `https://uper.li/${link.shortUrl}`
    setQrCode(url)
  }

  const downloadQR = () => {
    if (!qrRef.current) return

    const canvas = qrRef.current
    const link = document.createElement('a')
    link.download = `qr-${selectedLink}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="px-6 py-8 sm:px-0">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900">QR Code</h1>
        <p className="mt-2 text-lg text-gray-600">
          Generate QR code untuk short link Anda
        </p>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-8">
        <div className="space-y-8">
          <div>
            <label htmlFor="link" className="block text-base font-medium text-gray-700 mb-3">
              Pilih Link
            </label>
            <select
              id="link"
              value={selectedLink}
              onChange={(e) => setSelectedLink(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            >
              <option value="">Pilih link...</option>
              {links.map((link) => (
                <option key={link.id} value={link.id}>
                  uper.li/{link.shortUrl} - {link.longUrl}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generateQR}
            disabled={!selectedLink}
            className="w-full flex justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate QR Code
          </button>

          {qrCode && (
            <div className="mt-8">
              <p className="text-base text-gray-600 mb-4">QR Code untuk: {qrCode}</p>
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <QRCodeCanvas
                  value={qrCode}
                  size={256}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                  ref={qrRef}
                />
                <button
                  onClick={downloadQR}
                  className="mt-6 inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Download QR Code
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}