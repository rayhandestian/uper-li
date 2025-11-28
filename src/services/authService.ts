import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendEmail } from '@/lib/email'
import { get2FALoginEmailHtml } from '@/lib/email-templates'
import { generateSecureCode } from '@/lib/generateSecureCode'
import { addConstantDelay, performDummyHash } from '@/lib/timing'
import { logger } from '@/lib/logger'

export interface LoginCredentials {
    nimOrUsername?: string
    password?: string
}

export interface AuthUser {
    id: string
    email: string
    name: string | null
    role: string
    nimOrUsername: string
    requires2FA: boolean
}

export class AuthService {
    static async validateUser(credentials: LoginCredentials): Promise<AuthUser | null> {
        if (!credentials?.nimOrUsername || !credentials?.password) {
            await performDummyHash()
            await addConstantDelay()
            return null
        }

        // Get user using Prisma
        const user = await prisma.user.findUnique({
            where: { nimOrUsername: credentials.nimOrUsername }
        })

        // Always perform password comparison to prevent timing attacks
        const passwordHash = user?.password || await bcrypt.hash('dummy', 12)
        const isValid = await bcrypt.compare(credentials.password, passwordHash)

        // Check all conditions before returning
        const isAuthenticated = user && user.password && isValid && user.emailVerified

        if (!isAuthenticated) {
            await addConstantDelay()
            return null
        }

        // Check if 2FA is required
        if (user.twoFactorEnabled) {
            // Generate secure alphanumeric 2FA code and send email
            const verificationCode = generateSecureCode()
            const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

            // Update user with 2FA code using Prisma
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    twoFactorLoginCode: verificationCode,
                    verificationTokenExpires: verificationCodeExpires,
                    updatedAt: new Date()
                }
            })

            // Send 2FA code via email
            try {
                await sendEmail({
                    to: user.email,
                    from: 'noreply@uper.li',
                    subject: 'Kode 2FA - UPer.li',
                    html: get2FALoginEmailHtml(user.nimOrUsername, verificationCode),
                })
            } catch (error) {
                logger.error('2FA email sending error:', error)
                return null
            }

            // Return user with 2FA required flag
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                nimOrUsername: user.nimOrUsername,
                requires2FA: true
            }
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            nimOrUsername: user.nimOrUsername,
            requires2FA: false
        }
    }
}
