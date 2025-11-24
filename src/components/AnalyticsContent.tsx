'use client'

import { useState } from 'react'
import ShortUrlActions from '@/components/ShortUrlActions'
import TimeZoneDisplay from '@/components/TimeZoneDisplay'

interface Link {
  id: string
  shortUrl: string
  longUrl: string
  visitCount: number
  lastVisited: Date | null
}

interface AnalyticsContentProps {
  links: Link[]
  totalVisits: number
}

export default function AnalyticsContent({ links, totalVisits }: AnalyticsContentProps) {
  const [timeZone, setTimeZone] = useState('Asia/Jakarta')

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analitik Link</h1>
        <p className="mt-2 text-base sm:text-lg text-gray-600">
          Lihat statistik kunjungan link Anda
        </p>
      </div>


      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8 sm:mb-12">
        <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-lg">
          <div className="p-6 sm:p-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-base sm:text-lg font-medium">V</span>
                </div>
              </div>
              <div className="ml-4 sm:ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-sm sm:text-base font-medium text-gray-500 truncate">
                    Total Kunjungan
                  </dt>
                  <dd className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1">
                    {totalVisits}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-lg">
          <div className="p-6 sm:p-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-base sm:text-lg font-medium">L</span>
                </div>
              </div>
              <div className="ml-4 sm:ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-sm sm:text-base font-medium text-gray-500 truncate">
                    Link Aktif
                  </dt>
                  <dd className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1">
                    {links.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded-lg">
        <div className="px-8 py-8 sm:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
            <h3 className="text-2xl leading-6 font-semibold text-gray-900">
              Link Terpopuler
            </h3>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <label className="text-sm text-gray-700">Zona Waktu:</label>
              <select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="text-sm text-gray-900 border rounded px-2 py-1 bg-white"
              >
                <option value="Asia/Jakarta">WIB (Jakarta)</option>
                <option value="Asia/Makassar">WITA (Makassar)</option>
                <option value="Asia/Jayapura">WIT (Jayapura)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>
        <ul className="divide-y divide-gray-200">
          {links.map((link) => (
            <li key={link.id}>
              <div className="px-8 py-6 sm:px-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <ShortUrlActions shortUrl={link.shortUrl} />
                    <p className="mt-2 text-base text-gray-500 sm:truncate">
                      {link.longUrl}
                    </p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end">
                    <span className="text-lg text-gray-900">
                      {link.visitCount} kunjungan
                    </span>
                    <TimeZoneDisplay timestamp={link.lastVisited ? link.lastVisited.toISOString() : null} timeZone={timeZone} />
                  </div>
                </div>
              </div>
            </li>
          ))}
          {links.length === 0 && (
            <li>
              <div className="px-8 py-6 sm:px-8 text-center text-gray-500">
                Belum ada link yang dibuat.
              </div>
            </li>
          )}
        </ul>
      </div>

    </div>
  )
}