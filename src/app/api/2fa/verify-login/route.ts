import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code } = await request.json()

  if (!code) {
    return NextResponse.json({ error: 'Kode verifikasi diperlukan.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
  }

  if (!user.twoFactorEnabled) {
    return NextResponse.json({ error: '2FA tidak diaktifkan.' }, { status: 400 })
  }

  if (!user.twoFactorSecret || !user.verificationTokenExpires) {
    return NextResponse.json({ error: 'Kode verifikasi tidak ditemukan.' }, { status: 400 })
  }

  if (user.verificationTokenExpires < new Date()) {
    return NextResponse.json({ error: 'Kode verifikasi telah kadaluarsa.' }, { status: 400 })
  }

  if (user.twoFactorSecret !== code) {
    return NextResponse.json({ error: 'Kode verifikasi salah.' }, { status: 400 })
  }

  // Clear the temporary 2FA code
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorSecret: null,
      verificationTokenExpires: null,
    },
  })

  return NextResponse.json({ message: 'Verifikasi 2FA berhasil.' })
}