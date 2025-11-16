import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
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

        // Get user using raw SQL
        const userResult = await db.query(
          'SELECT * FROM "User" WHERE "nimOrUsername" = $1',
          [credentials.nimOrUsername]
        )

        if (userResult.rows.length === 0) return null

        const user = userResult.rows[0]

        if (!user.password) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        // Check if 2FA is required
        if (user.twoFactorEnabled) {
          // Generate 2FA code and send email
          const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
          const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

          // Update user with 2FA code using raw SQL
          await db.query(
            `UPDATE "User" 
             SET "twoFactorSecret" = $1, "verificationTokenExpires" = $2, "updatedAt" = NOW()
             WHERE id = $3`,
            [verificationCode, verificationCodeExpires, user.id]
          )

          // Send 2FA code via email
          try {
            await transporter.sendMail({
              to: user.email,
              from: 'noreply@uper.li',
              subject: 'Kode 2FA - UPer.li',
              html: `
                <p>Halo ${user.nimOrUsername},</p>
                <p>Kode verifikasi 2FA Anda: <strong>${verificationCode}</strong></p>
                <p>Kode ini akan kadaluarsa dalam 10 menit.</p>
                <p>Jika Anda tidak mencoba masuk, abaikan email ini.</p>
                <p>Salam,<br>Tim UPer.li</p>
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