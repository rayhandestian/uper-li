import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { sendEmail } from '@/lib/email'
import { get2FALoginEmailHtml } from '@/lib/email-templates'
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
        if (!credentials?.nimOrUsername || !credentials?.password) return null

        // Get user using Prisma
        const user = await prisma.user.findUnique({
          where: { nimOrUsername: credentials.nimOrUsername }
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        // Check if email is verified
        if (!user.emailVerified) {
          return null
        }

        // Check if 2FA is required
        if (user.twoFactorEnabled) {
          // Generate 2FA code and send email
          const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
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
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.requires2FA = user.requires2FA
        token.nimOrUsername = user.nimOrUsername
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.nimOrUsername = token.nimOrUsername as string
        if (token.requires2FA) {
          // Check if 2FA verification code has been cleared (meaning verified) using Prisma
          const user = await prisma.user.findUnique({
            where: { id: token.sub! },
            select: { twoFactorLoginCode: true }
          })

          if (user && !user.twoFactorLoginCode) {
            session.user.requires2FA = false
          } else {
            session.user.requires2FA = true
          }
        } else {
          session.user.requires2FA = false
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
}
