import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

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

        // Check if 2FA is required
        if (user.twoFactorEnabled) {
          // Generate 2FA code and send email
          const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
          const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

          await prisma.user.update({
            where: { id: user.id },
            data: {
              twoFactorSecret: verificationCode,
              verificationTokenExpires: verificationCodeExpires,
            },
          })

          // Send 2FA code via email
          try {
            await transporter.sendMail({
              to: user.email,
              from: 'noreply@uper.link',
              subject: 'Kode 2FA - UPer.link',
              html: `
                <p>Halo ${user.nimOrUsername},</p>
                <p>Kode verifikasi 2FA Anda: <strong>${verificationCode}</strong></p>
                <p>Kode ini akan kadaluarsa dalam 10 menit.</p>
                <p>Jika Anda tidak mencoba masuk, abaikan email ini.</p>
                <p>Salam,<br>Tim UPer.link</p>
              `,
            })
          } catch (error) {
            console.error('2FA email sending error:', error)
            return null
          }

          // Return user with 2FA required flag
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            requires2FA: true
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          requires2FA: false
        }
      }
    }),
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      },
      from: 'noreply@uper.link',
      sendVerificationRequest: async ({ identifier, url }) => {
        if (!isUPerEmail(identifier)) {
          throw new Error('Email must be from Universitas Pertamina domain')
        }

        await transporter.sendMail({
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