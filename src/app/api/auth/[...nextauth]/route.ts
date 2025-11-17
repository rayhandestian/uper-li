import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/rateLimit'

const handler = NextAuth(authOptions)

export const GET = withRateLimit(handler, { limit: 10, windowMs: 15 * 60 * 1000 }) // 10 attempts per 15 minutes
export const POST = withRateLimit(handler, { limit: 10, windowMs: 15 * 60 * 1000 }) // 10 attempts per 15 minutes