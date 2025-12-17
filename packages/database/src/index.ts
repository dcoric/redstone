import { PrismaClient } from '@prisma/client';

export const DATABASE_PKG_NAME = "@redstone/database";

// Create a singleton instance of Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Export Prisma types
export * from '@prisma/client';
