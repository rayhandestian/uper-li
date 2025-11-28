import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { sendEmail } from '@/lib/email'
import { get2FALoginEmailHtml } from '@/lib/email-templates'
import { generateSecureCode } from './generateSecureCode'
import { addConstantDelay, performDummyHash } from './timing'
import { logger } from '@/lib/logger'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        nimOrUsername: { label: 'NIM/Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
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
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
        token.requires2FA = user.requires2FA
        token.nimOrUsername = user.nimOrUsername
      }

      // Handle session update from client
      if (trigger === "update" && session?.twoFactorVerified) {
        // Verify against database one last time to be safe
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub! },
          select: { twoFactorLoginCode: true }
        })

        if (dbUser && !dbUser.twoFactorLoginCode) {
           token.requires2FA = false
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.nimOrUsername = token.nimOrUsername as string
        // Trust the token state - NO DATABASE QUERY HERE
        session.user.requires2FA = token.requires2FA as boolean
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
}
