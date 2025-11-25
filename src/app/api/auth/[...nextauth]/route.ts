import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

import { withRateLimit } from '@/lib/rateLimit'

const handler = NextAuth(authOptions)

const rateLimitedPost = withRateLimit(handler, { limit: 6, windowMs: 15 * 60 * 1000 }) // 6 attempts per 15 minutes

export { handler as GET, rateLimitedPost as POST }