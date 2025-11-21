'use client'

import { useState } from 'react'

interface TimeZoneDisplayProps {
  timestamp: string | null
  timeZone: string
}

function formatDate(date: Date, timeZone: string): string {
    const dateStr = date.toLocaleString('id-ID', {
        timeZone,
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeStr = date.toLocaleString('id-ID', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit'
    }).replace('.', ':');
    return `${dateStr} ${timeStr}`;
}

export default function TimeZoneDisplay({ timestamp, timeZone, showIcon = true, className = "" }: TimeZoneDisplayProps & { showIcon?: boolean, className?: string }) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (!timestamp) return <span className={className}>Belum pernah</span>

  const date = new Date(timestamp)
  const displayString = formatDate(date, timeZone)

  if (!showIcon) {
    return <span className={className}>{displayString}</span>
  }

  return (
    <div className={`relative group mt-1 ${className}`}>
      <span
        className="text-sm text-gray-500 flex items-center gap-1 cursor-help"
        onClick={() => { setShowTooltip(true); setTimeout(() => setShowTooltip(false), 3000) }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {displayString}
      </span>
      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-md transition-opacity pointer-events-none whitespace-nowrap z-10 ${showTooltip ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        Kunjungan terbaru
      </div>
    </div>
  )
}