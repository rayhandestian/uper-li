import nodemailer from 'nodemailer'

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
  console.log('Email sent:', info.messageId)
  return info
}