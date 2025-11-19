'use client'

import { useState } from 'react'

interface ShortUrlActionsProps {
  shortUrl: string
}

export default function ShortUrlActions({ shortUrl }: ShortUrlActionsProps) {
  const [copied, setCopied] = useState(false)

  const fullUrl = `uper.li/${shortUrl}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const visitUrl = () => {
    window.open(`https://${fullUrl}`, '_blank')
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm sm:text-base font-medium text-blue-600 break-words">
        {fullUrl}
      </span>
      <button
        onClick={copyToClipboard}
        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Copy URL"
      >
        {copied ? (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
      <button
        onClick={visitUrl}
        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Visit URL"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </button>
    </div>
  )
}