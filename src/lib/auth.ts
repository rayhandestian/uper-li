import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

const isUPerEmail = (email: string) => {
  return email.endsWith('@student.universitaspertamina.ac.id') || email.endsWith('@universitaspertamina.ac.id')
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        nimOrUsername: { label: 'NIM/Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.nimOrUsername || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { nimOrUsername: credentials.nimOrUsername }
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    }),
    EmailProvider({
      server: {
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      },
      from: 'noreply@uper.link',
      sendVerificationRequest: async ({ identifier, url }) => {
        if (!isUPerEmail(identifier)) {
          throw new Error('Email must be from Universitas Pertamina domain')
        }

        await sgMail.send({
          to: identifier,
          from: 'noreply@uper.link',
          subject: 'Sign in to UPer.link',
          html: `<p>Click <a href="${url}">here</a> to sign in.</p>`
        })
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
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
}