import { prisma } from '@/lib/prisma'
import { checkUrlSafety } from '@/lib/safeBrowsing'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { Prisma, Link } from '@prisma/client'

const RESERVED_PATHS = [
    'dashboard',
    'login',
    'register',
    'terms',
    'privacy',
    'contact',
    'verify',
    'admin'
]

export interface CreateLinkData {
    longUrl: string
    customUrl?: string
    password?: string
}

export interface GetLinksOptions {
    page?: number
    limit?: number
    search?: string
    active?: boolean
    sort?: 'createdAt' | 'updatedAt' | 'shortUrl' | 'visitCount' | 'lastVisited'
    order?: 'asc' | 'desc'
}

export class LinkService {
    static async createLink(userId: string, data: CreateLinkData): Promise<Link> {
        const { longUrl, customUrl, password } = data

        if (!longUrl) {
            throw new Error('URL asli diperlukan.')
        }

        // Validate URL format
        try {
            new URL(longUrl)
        } catch {
            throw new Error('URL tidak valid.')
        }

        // Check URL length
        if (longUrl.length > 2048) {
            throw new Error('URL terlalu panjang (max 2048 karakter).')
        }

        // Check safety
        const isSafe = await checkUrlSafety(longUrl)
        if (!isSafe) {
            throw new Error('URL terdeteksi berbahaya.')
        }

        return await prisma.$transaction(async (tx) => {
            // Get user
            const user = await tx.user.findUnique({
                where: { id: userId }
            })

            if (!user) {
                throw new Error('User tidak ditemukan.')
            }

            // Check limits
            const maxMonthly = user.role === 'STUDENT' ? 5 : 10
            const maxTotal = user.role === 'STUDENT' ? 100 : 200

            if ((user.monthlyLinksCreated || 0) >= maxMonthly) {
                throw new Error('Batas link bulanan tercapai.')
            }

            if ((user.totalLinks || 0) >= maxTotal) {
                throw new Error('Batas total link tercapai.')
            }

            let shortUrl = customUrl

            if (customUrl) {
                // Validate custom URL
                if (customUrl.length > 255 || !/^[a-zA-Z0-9-_]+$/.test(customUrl)) {
                    throw new Error('Short URL kustom tidak valid.')
                }

                // Check if custom URL is reserved
                if (RESERVED_PATHS.includes(customUrl)) {
                    throw new Error('Short URL kustom tidak tersedia.')
                }

                // Check if custom URL is taken
                const existingLink = await tx.link.findUnique({
                    where: { shortUrl: customUrl }
                })

                if (existingLink) {
                    throw new Error('Short URL kustom sudah digunakan.')
                }
            } else {
                // Generate random short URL
                let attempts = 0
                do {
                    shortUrl = crypto.randomBytes(3).toString('hex') // 6 characters
                    attempts++
                    if (attempts > 10) {
                        throw new Error('Gagal menghasilkan short URL.')
                    }

                    const existingLink = await tx.link.findUnique({
                        where: { shortUrl: shortUrl }
                    })

                    if (!existingLink && !RESERVED_PATHS.includes(shortUrl)) break
                } while (true)
            }

            // Hash password if provided
            let hashedPassword = null
            if (password) {
                if (password.length < 4) {
                    throw new Error('Password minimal 4 karakter.')
                }
                hashedPassword = await bcrypt.hash(password, 12)
            }

            // Create link
            const link = await tx.link.create({
                data: {
                    shortUrl: shortUrl!,
                    longUrl,
                    userId: user.id,
                    custom: !!customUrl,
                    password: hashedPassword,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            })

            // Update user counters
            await tx.user.update({
                where: { id: user.id },
                data: {
                    monthlyLinksCreated: { increment: 1 },
                    totalLinks: { increment: 1 },
                    updatedAt: new Date()
                }
            })

            return link
        })
    }

    static async getLinks(userId: string, options: GetLinksOptions = {}) {
        const {
            page = 1,
            limit = 10,
            search = '',
            active,
            sort = 'createdAt',
            order = 'desc'
        } = options

        const skip = (page - 1) * limit

        // Build WHERE clause for Prisma
        const where: Prisma.LinkWhereInput = {
            userId
        }

        if (search) {
            where.OR = [
                { shortUrl: { contains: search, mode: 'insensitive' } },
                { longUrl: { contains: search, mode: 'insensitive' } }
            ]
        }

        if (active !== undefined) {
            where.active = active
        }

        // Get total count using Prisma
        const total = await prisma.link.count({ where })
        const totalPages = Math.ceil(total / limit)

        // Get paginated links using Prisma
        const links = await prisma.link.findMany({
            where,
            orderBy: { [sort]: order },
            take: limit,
            skip
        })

        return {
            links,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        }
    }
}
