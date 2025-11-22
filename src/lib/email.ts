import nodemailer from 'nodemailer'
import { logger } from '@/lib/logger'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail(options: {
  to: string
  from: string
  subject: string
  html: string
}) {
  const info = await transporter.sendMail(options)
  logger.info('Email sent:', { messageId: info.messageId })
  return info
}