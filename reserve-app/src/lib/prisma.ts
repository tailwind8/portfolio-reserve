import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Prisma Client Singleton Pattern with PostgreSQL Driver Adapter (Prisma 7+)
// Prevents multiple instances in development due to hot reloading
// See: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Create PostgreSQL connection pool
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // During build time, DATABASE_URL may not be available
    // Return a client without adapter for build compatibility
    console.warn('DATABASE_URL is not set. Using PrismaClient without adapter.');
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {globalForPrisma.prisma = prisma;}

export default prisma;
