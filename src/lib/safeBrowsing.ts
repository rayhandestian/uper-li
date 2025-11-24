import { google } from 'googleapis'
import { logger } from '@/lib/logger'

const safebrowsing = google.safebrowsing('v4')

export async function checkUrlSafety(url: string): Promise<boolean> {
  try {
    const response = await safebrowsing.threatMatches.find({
      key: process.env.GOOGLE_SAFE_BROWSING_API_KEY!,
      requestBody: {
        client: {
          clientId: 'uper-li',
          clientVersion: '1.0.0',
        },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      },
    })

    // If there are matches, the URL is unsafe
    return !response.data.matches || response.data.matches.length === 0
  } catch (error) {
    logger.error('Safe Browsing API error:', error)
    // If API fails, allow the URL (fail-safe)
    return true
  }
}