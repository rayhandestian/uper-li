import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { AuthService } from '@/services/authService'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        nimOrUsername: { label: 'NIM/Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        sessionToken: { label: 'Session Token', type: 'hidden' }
      },
      async authorize(credentials) {
        return await AuthService.validateUser({
          nimOrUsername: credentials?.nimOrUsername,
          password: credentials?.password,
          sessionToken: credentials?.sessionToken
        })
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
          where: { id: token.sub as string },
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
        session.user.id = token.sub as string
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
