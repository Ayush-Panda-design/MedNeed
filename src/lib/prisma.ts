import dns from 'node:dns';
import { PrismaClient } from '@prisma/client';

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('verbatim');
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
