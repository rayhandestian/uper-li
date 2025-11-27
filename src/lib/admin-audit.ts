import { prisma } from './prisma'
import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'

export interface AuditLogOptions {
    adminId?: string
    action: string
    resource?: string
    details?: Record<string, unknown>
    success?: boolean
    req?: NextRequest
}

/**
 * Extract client IP address from request
 */
function getClientIP(req?: NextRequest): string | undefined {
    if (!req) return undefined

    const forwardedFor = req.headers.get('x-forwarded-for')
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim()
    }
    const realIP = req.headers.get('x-real-ip')
    if (realIP) {
        return realIP
    }
    return undefined
}

/**
 * Extract user agent from request
 */
function getUserAgent(req?: NextRequest): string | undefined {
    if (!req) return undefined
    return req.headers.get('user-agent') || undefined
}

/**
 * Log an admin action to the audit log
 * All admin actions should be logged for security and compliance
 */
export async function logAdminAction(options: AuditLogOptions): Promise<void> {
    const {
        adminId,
        action,
        resource,
        details,
        success = true,
        req
    } = options

    await prisma.adminAuditLog.create({
        data: {
            adminId: adminId || null,
            action,
            resource: resource || null,
            details: details ? JSON.stringify(details) : null,
            ipAddress: getClientIP(req),
            userAgent: getUserAgent(req),
            success
        }
    })
}

/**
 * Get audit logs for a specific admin
 * Used in admin account page to show recent activity
 */
export async function getAdminAuditLogs(adminId: string, limit: number = 20) {
    return await prisma.adminAuditLog.findMany({
        where: { adminId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
            id: true,
            action: true,
            resource: true,
            details: true,
            ipAddress: true,
            success: true,
            createdAt: true
        }
    })
}

/**
 * Get recent audit logs across all admins
 * Used in admin audit log viewer
 */
export async function getRecentAuditLogs(
    limit: number = 50,
    filters?: {
        adminId?: string
        action?: string
        startDate?: Date
        endDate?: Date
        success?: boolean
    }
) {
    const where: Prisma.AdminAuditLogWhereInput = {}

    if (filters?.adminId) {
        where.adminId = filters.adminId
    }

    if (filters?.action) {
        where.action = filters.action
    }

    if (filters?.success !== undefined) {
        where.success = filters.success
    }

    if (filters?.startDate || filters?.endDate) {
        where.createdAt = {}
        if (filters.startDate) {
            where.createdAt.gte = filters.startDate
        }
        if (filters.endDate) {
            where.createdAt.lte = filters.endDate
        }
    }

    return await prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
            admin: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    })
}

/**
 * Get distinct audit log actions
 * Used for filtering in audit log viewer
 */
export async function getAuditLogActions(): Promise<string[]> {
    const actions = await prisma.adminAuditLog.findMany({
        select: {
            action: true
        },
        distinct: ['action'],
        orderBy: {
            action: 'asc'
        }
    })

    return actions.map(a => a.action)
}

// Common audit log action constants
export const AUDIT_ACTIONS = {
    // Authentication
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGIN_LOCKED: 'LOGIN_LOCKED',
    LOGOUT: 'LOGOUT',
    LOGOUT_ALL: 'LOGOUT_ALL',
    SESSION_REVOKED: 'SESSION_REVOKED',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',

    // User management
    USER_VIEW: 'USER_VIEW',
    USER_UPDATE: 'USER_UPDATE',
    USER_ACTIVATE: 'USER_ACTIVATE',
    USER_DEACTIVATE: 'USER_DEACTIVATE',
    USER_DELETE: 'USER_DELETE',

    // Link management
    LINK_VIEW: 'LINK_VIEW',
    LINK_DELETE: 'LINK_DELETE',

    // Admin management
    ADMIN_CREATE: 'ADMIN_CREATE',
    ADMIN_UPDATE: 'ADMIN_UPDATE',
    ADMIN_DELETE: 'ADMIN_DELETE',
    ADMIN_ACTIVATE: 'ADMIN_ACTIVATE',
    ADMIN_DEACTIVATE: 'ADMIN_DEACTIVATE',

    // System
    CRON_MANUAL_TRIGGER: 'CRON_MANUAL_TRIGGER',
    SETTINGS_CHANGE: 'SETTINGS_CHANGE'
} as const
