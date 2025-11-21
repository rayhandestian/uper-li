import { useState } from 'react'
import ShortUrlActions from '@/components/ShortUrlActions'
import TimeZoneDisplay from '@/components/TimeZoneDisplay'

interface Link {
    id: string
    shortUrl: string
    longUrl: string
    custom: boolean
    customChanges: number
    customChangedAt: string | null
    mode: 'PREVIEW' | 'DIRECT'
    active: boolean
    createdAt: string
    visitCount: number
    hasPassword: boolean
    lastVisited?: Date | null
}

interface LinkItemProps {
    link: Link
    timeZone: string
    onEdit: (link: Link) => void
    onDelete: (id: string) => void
    onToggleActive: (id: string, active: boolean) => void
    onOpenQr: (link: Link) => void
}

export default function LinkItem({
    link,
    timeZone,
    onEdit,
    onDelete,
    onToggleActive,
    onOpenQr
}: LinkItemProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <li className="bg-white hover:bg-gray-50 transition-colors duration-150">
            <div
                className="px-4 py-4 sm:px-6 flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center">
                        <ShortUrlActions shortUrl={link.shortUrl} />
                    </div>
                    <p className="mt-1 text-base sm:text-sm text-gray-500 break-all sm:truncate">
                        {link.longUrl}
                    </p>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsExpanded(!isExpanded)
                    }}
                    className="ml-2 p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                    aria-label={isExpanded ? "Collapse details" : "Expand details"}
                >
                    <svg
                        className={`w-6 h-6 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Expanded Details */}
            <div
                className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
            >
                <div className="overflow-hidden">
                    <div className="px-4 pb-4 sm:px-6">
                        <div className="pt-4 border-t border-gray-200 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Metadata Section */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Informasi Link</h4>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center text-gray-600">
                                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>Dibuat</span>
                                        </div>
                                        <span className="font-medium text-gray-900">
                                            {new Date(link.createdAt).toLocaleString('id-ID', {
                                                timeZone,
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center text-gray-600">
                                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            <span>Total Kunjungan</span>
                                        </div>
                                        <span className="font-medium text-gray-900">{link.visitCount}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center text-gray-600">
                                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Terakhir Dikunjungi</span>
                                        </div>
                                        <div className="font-medium text-gray-900 text-right">
                                            <TimeZoneDisplay timestamp={link.lastVisited ? new Date(link.lastVisited).toISOString() : null} timeZone={timeZone} showIcon={false} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Section */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Tindakan</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => onOpenQr(link)}
                                        className="flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all hover:shadow-sm"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                        QR Code
                                    </button>

                                    <button
                                        onClick={() => onEdit(link)}
                                        className="flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all hover:shadow-sm"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => onToggleActive(link.id, link.active)}
                                        className={`flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium border transition-all hover:shadow-sm ${link.active
                                                ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                                : 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200'
                                            }`}
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        {link.active ? 'Nonaktifkan' : 'Aktifkan'}
                                    </button>

                                    <button
                                        onClick={() => onDelete(link.id)}
                                        className="flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all hover:shadow-sm"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    )
}
