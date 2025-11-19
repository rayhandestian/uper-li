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
    <span className="text-sm text-gray-500 mt-1">
      Terakhir: {formatted}
    </span>
  )
}