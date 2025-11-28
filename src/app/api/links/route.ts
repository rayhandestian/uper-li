import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { withRateLimit } from '@/lib/rateLimit'
import { LinkService } from '@/services/linkService'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''
  const activeParam = searchParams.get('active')
  const sortParam = searchParams.get('sort')
  const orderParam = searchParams.get('order')

  let active: boolean | undefined
  if (activeParam !== null && activeParam !== undefined) {
    active = activeParam === 'true'
  }

  const validSorts = ['createdAt', 'updatedAt', 'shortUrl', 'visitCount', 'lastVisited'] as const
  type ValidSort = typeof validSorts[number]
  const sort = validSorts.includes(sortParam as ValidSort) ? sortParam as ValidSort : 'createdAt'
  const order = orderParam === 'asc' ? 'asc' : 'desc'

  try {
    const result = await LinkService.getLinks(session.user.id, {
      page,
      limit,
      search,
      active,
      sort,
      order
    })

    return NextResponse.json(result)
  } catch (error) {
    logger.error('Get links error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

async function handleCreateLink(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  try {
    const link = await LinkService.createLink(session.user.id, body)
    return NextResponse.json(link)
  } catch (error: unknown) {
    // Handle specific errors
    if (error instanceof Error) {
      const message = error.message
      const clientErrors = [
        'URL asli diperlukan.',
        'URL tidak valid.',
        'URL terlalu panjang (max 2048 karakter).',
        'URL terdeteksi berbahaya.',
        'User tidak ditemukan.',
        'Batas link bulanan tercapai.',
        'Batas total link tercapai.',
        'Short URL kustom tidak valid.',
        'Short URL kustom tidak tersedia.',
        'Short URL kustom sudah digunakan.',
        'Password minimal 4 karakter.',
        'Gagal menghasilkan short URL.'
      ]

      if (clientErrors.includes(message)) {
        return NextResponse.json({ error: message }, { status: 400 })
      }
    }

    logger.error('Link creation error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

export const POST = withRateLimit(handleCreateLink, { limit: 10, windowMs: 60 * 1000 }) // 10 attempts per minute