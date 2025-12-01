type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
    timestamp: string
    level: LogLevel
    message: string
    context?: Record<string, unknown>
    error?: unknown
}

class Logger {
    private readonly isDevelopment = process.env.NODE_ENV === 'development'

    private formatError(error: unknown): Record<string, unknown> {
        if (error instanceof Error) {
            return {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: error.cause,
            }
        }
        return { message: String(error) }
    }

    private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: unknown) {
        // In production, we might want to suppress debug logs
        if (level === 'debug' && !this.isDevelopment) {
            return
        }

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
        }

        if (error) {
            entry.error = this.formatError(error)
        }

        if (this.isDevelopment) {
            // Pretty print in development
            const color = {
                debug: '\x1b[34m', // Blue
                info: '\x1b[32m',  // Green
                warn: '\x1b[33m',  // Yellow
                error: '\x1b[31m', // Red
            }[level]

            const reset = '\x1b[0m'

            console.log(
                `${color}[${level.toUpperCase()}]${reset} ${message}`,
                context ?? '',
                error ?? ''
            )
        } else {
            // JSON output for production
            console.log(JSON.stringify(entry))
        }
    }

    debug(message: string, context?: Record<string, unknown>) {
        this.log('debug', message, context)
    }

    info(message: string, context?: Record<string, unknown>) {
        this.log('info', message, context)
    }

    warn(message: string, context?: Record<string, unknown>, error?: unknown) {
        this.log('warn', message, context, error)
    }

    error(message: string, error?: unknown, context?: Record<string, unknown>) {
        this.log('error', message, context, error)
    }
}

export const logger = new Logger()
