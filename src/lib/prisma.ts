// Mock Prisma export to prevent build errors during migration to raw SQL
export const prisma = {
  user: {
    findUnique: () => null,
    findFirst: () => null,
    create: () => null,
    update: () => null,
    updateMany: () => null,
    delete: () => null,
    deleteMany: () => null,
    findMany: () => [],
    count: () => 0,
  },
  link: {
    findUnique: () => null,
    findFirst: () => null,
    create: () => null,
    update: () => null,
    updateMany: () => null,
    delete: () => null,
    deleteMany: () => null,
    findMany: () => [],
    count: () => 0,
  },
  visit: {
    create: () => null,
    findMany: () => [],
    deleteMany: () => null,
  },
  $executeRaw: () => null,
  $transaction: () => null,
}

export default prisma