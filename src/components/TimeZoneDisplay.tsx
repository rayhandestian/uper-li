'use client'

interface TimeZoneDisplayProps {
  timestamp: string | null
  timeZone: string
}

export default function TimeZoneDisplay({ timestamp, timeZone }: TimeZoneDisplayProps) {
  if (!timestamp) return null

  const date = new Date(timestamp)
  const offsetHours = timeZone === 'Asia/Jakarta' ? 7 :
                     timeZone === 'Asia/Makassar' ? 8 :
                     timeZone === 'Asia/Jayapura' ? 9 : 0
  const adjustedDate = new Date(date.getTime() + offsetHours * 60 * 60 * 1000)
  const formatted = adjustedDate.toLocaleString('id-ID')

  return (
    <span className="text-sm text-gray-500 mt-1">
      Terakhir: {formatted}
    </span>
  )
}