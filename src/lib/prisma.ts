// Mock Prisma export to prevent build errors during migration to raw SQL
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
export const prisma = {
  user: {
    findUnique: (args: any) => ({ 
      id: '', email: '', nimOrUsername: '', role: '', active: true, 
      name: '', password: '', twoFactorEnabled: false, monthlyLinksCreated: 0, totalLinks: 0 
    }),
    findFirst: (args: any) => ({ 
      id: '', email: '', nimOrUsername: '', role: '', active: true, 
      name: '', password: '', twoFactorEnabled: false, monthlyLinksCreated: 0, totalLinks: 0 
    }),
    create: (args: any) => ({ 
      id: '', email: '', nimOrUsername: '', role: '', active: true, 
      name: '', password: '', twoFactorEnabled: false, monthlyLinksCreated: 0, totalLinks: 0 
    }),
    createMany: (args: any) => ({ count: 0 }),
    update: (args: any) => ({ 
      id: '', email: '', nimOrUsername: '', role: '', active: true, 
      name: '', password: '', twoFactorEnabled: false, monthlyLinksCreated: 0, totalLinks: 0 
    }),
    updateMany: (args: any) => ({ count: 0 }),
    delete: (args: any) => ({ 
      id: '', email: '', nimOrUsername: '', role: '', active: true, 
      name: '', password: '', twoFactorEnabled: false, monthlyLinksCreated: 0, totalLinks: 0 
    }),
    deleteMany: (args: any) => ({ count: 0 }),
    findMany: (args: any) => [{ 
      id: '', email: '', nimOrUsername: '', role: '', active: true, 
      name: '', password: '', twoFactorEnabled: false, monthlyLinksCreated: 0, totalLinks: 0 
    }],
    count: (args?: any) => 0,
    aggregate: (args: any) => ({ _count: { _all: 0 } }),
    groupBy: (args: any) => [{ role: 'STUDENT', _count: { role: 0 } }],
    upsert: (args: any) => ({ 
      id: '', email: '', nimOrUsername: '', role: '', active: true, 
      name: '', password: '', twoFactorEnabled: false, monthlyLinksCreated: 0, totalLinks: 0 
    }),
  },
  link: {
    findUnique: (args: any) => ({ 
      id: '', shortUrl: '', longUrl: '', userId: '', active: true, visitCount: 0,
      mode: 'PREVIEW', custom: false, password: '', customChanges: 0, customChangedAt: null,
      createdAt: new Date(), updatedAt: new Date(), lastVisited: null, qrCode: null,
      deactivatedAt: null,
      user: { nimOrUsername: '', email: '', role: '' }
    }),
    findFirst: (args: any) => ({ 
      id: '', shortUrl: '', longUrl: '', userId: '', active: true, visitCount: 0,
      mode: 'PREVIEW', custom: false, password: '', customChanges: 0, customChangedAt: null,
      createdAt: new Date(), updatedAt: new Date(), lastVisited: null, qrCode: null,
      deactivatedAt: null,
      user: { nimOrUsername: '', email: '', role: '' }
    }),
    create: (args: any) => ({ 
      id: '', shortUrl: '', longUrl: '', userId: '', active: true, visitCount: 0,
      mode: 'PREVIEW', custom: false, password: '', customChanges: 0, customChangedAt: null,
      createdAt: new Date(), updatedAt: new Date(), lastVisited: null, qrCode: null,
      deactivatedAt: null,
      user: { nimOrUsername: '', email: '', role: '' }
    }),
    createMany: (args: any) => ({ count: 0 }),
    update: (args: any) => ({ 
      id: '', shortUrl: '', longUrl: '', userId: '', active: true, visitCount: 0,
      mode: 'PREVIEW', custom: false, password: '', customChanges: 0, customChangedAt: null,
      createdAt: new Date(), updatedAt: new Date(), lastVisited: null, qrCode: null,
      deactivatedAt: null,
      user: { nimOrUsername: '', email: '', role: '' }
    }),
    updateMany: (args: any) => ({ count: 0 }),
    delete: (args: any) => ({ 
      id: '', shortUrl: '', longUrl: '', userId: '', active: true, visitCount: 0,
      mode: 'PREVIEW', custom: false, password: '', customChanges: 0, customChangedAt: null,
      createdAt: new Date(), updatedAt: new Date(), lastVisited: null, qrCode: null,
      deactivatedAt: null,
      user: { nimOrUsername: '', email: '', role: '' }
    }),
    deleteMany: (args: any) => ({ count: 0 }),
    findMany: (args: any) => [{ 
      id: '', shortUrl: '', longUrl: '', userId: '', active: true, visitCount: 0,
      mode: 'PREVIEW', custom: false, password: '', customChanges: 0, customChangedAt: null,
      createdAt: new Date(), updatedAt: new Date(), lastVisited: null, qrCode: null,
      deactivatedAt: null,
      user: { nimOrUsername: '', email: '', role: '' }
    }],
    count: (args?: any) => 0,
    aggregate: (args: any) => ({ _count: { _all: 0 } }),
    groupBy: (args: any) => [{ count: 0 }],
    upsert: (args: any) => ({ 
      id: '', shortUrl: '', longUrl: '', userId: '', active: true, visitCount: 0,
      mode: 'PREVIEW', custom: false, password: '', customChanges: 0, customChangedAt: null,
      createdAt: new Date(), updatedAt: new Date(), lastVisited: null, qrCode: null,
      deactivatedAt: null,
      user: { nimOrUsername: '', email: '', role: '' }
    }),
  },
  visit: {
    create: (args: any) => ({ id: '', linkId: '', visitedAt: new Date(), ip: '', userAgent: '' }),
    createMany: (args: any) => ({ count: 0 }),
    findMany: (args: any) => [{ id: '', linkId: '', visitedAt: new Date(), ip: '', userAgent: '' }],
    deleteMany: (args: any) => ({ count: 0 }),
    count: (args?: any) => 0,
    aggregate: (args: any) => ({ _count: { _all: 0 } }),
  },
  $executeRaw: (query: any, ...args: any[]) => Promise.resolve({ rowCount: 0 }),
  $queryRaw: (query: any, ...args: any[]) => Promise.resolve([]),
  $transaction: (queries: any) => Promise.resolve(queries),
}

export default prisma