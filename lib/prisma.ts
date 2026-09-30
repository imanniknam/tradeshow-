import { createDriverAdapter } from "@/lib/db/adapter";
import { PrismaClient } from "@/lib/generated/prisma/client";

function createPrismaClient() {
  return new PrismaClient({ adapter: createDriverAdapter() });
}

// Reuse a single client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
