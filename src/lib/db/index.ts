import { PrismaClient } from '@prisma/client';
const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export const db =
  globalDb.prisma ??
  new PrismaClient({ datasourceUrl: process.env.DATABASE_URL ?? 'file:./wiener.db' });
if (process.env.NODE_ENV !== 'production') globalDb.prisma = db;
