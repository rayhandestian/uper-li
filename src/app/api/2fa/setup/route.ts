import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
  }

  if (user.twoFactorEnabled) {
    return NextResponse.json({ error: '2FA sudah diaktifkan.' }, { status: 400 })
  }

  // Generate verification code
  const verificationCode = crypto.randomInt(100000, 999999).toString()
  const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Update user with verification code
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorSecret: verificationCode,
      verificationTokenExpires: verificationCodeExpires,
    },
  })

  // Send verification email
  try {
    await sgMail.send({
      to: user.email,
      from: 'noreply@uper.link',
      subject: 'Verifikasi Aktivasi 2FA - UPer.link',
      html: `
        <p>Halo ${user.nimOrUsername},</p>
        <p>Anda telah meminta untuk mengaktifkan Two-Factor Authentication (2FA) pada akun UPer.link Anda.</p>
        <p>Kode verifikasi Anda: <strong>${verificationCode}</strong></p>
        <p>Kode ini akan kadaluarsa dalam 10 menit.</p>
        <p>Jika Anda tidak meminta aktivasi 2FA, abaikan email ini.</p>
        <p>Salam,<br>Tim UPer.link</p>
      `,
    })

    return NextResponse.json({ message: 'Kode verifikasi telah dikirim ke email Anda.' })
  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json({ error: 'Gagal mengirim email verifikasi.' }, { status: 500 })
  }
}