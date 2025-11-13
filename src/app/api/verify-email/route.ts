import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token tidak valid.' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpires: {
          gt: new Date(),
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Token tidak valid atau sudah kadaluarsa.' }, { status: 400 })
    }

    // Verify email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpires: null,
      },
    })

    // Redirect to login with success message
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?message=Email berhasil diverifikasi. Silakan masuk.`)
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}