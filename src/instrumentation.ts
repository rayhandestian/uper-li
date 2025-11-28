/**
 * Next.js instrumentation for startup validation
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Only run in Node.js runtime (not Edge)
        const { validateEnvironment } = await import('./lib/validateEnv')

        try {
            validateEnvironment()
        } catch (error) {
            console.error('FATAL: Environment validation failed', error)
            // In production, we want to fail fast
            if (process.env.NODE_ENV === 'production') {
                process.exit(1)
            }
            // In development, log but allow to continue for easier debugging
            console.warn('Continuing in development mode despite validation errors')
        }
    }
}
