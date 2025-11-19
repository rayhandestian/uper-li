'use client'

interface TimeZoneDisplayProps {
  timestamp: string | null
  timeZone: string
}

export default function TimeZoneDisplay({ timestamp, timeZone }: TimeZoneDisplayProps) {
  if (!timestamp) return null

  const date = new Date(timestamp)
  const formatted = date.toLocaleString('id-ID', { timeZone })

  return (
    <div className="relative group mt-1">
      <span className="text-sm text-gray-500 flex items-center gap-1 cursor-help">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {formatted}
      </span>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        Kunjungan terbaru
      </div>
    </div>
  )
}