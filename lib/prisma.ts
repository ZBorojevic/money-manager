// !!! IMPORTANT !!!
// Ovaj import mora biti RELATIVAN na file, jer je generator output: lib/generated/prisma
// Ako je fajl u lib/prisma.ts, ispravno je "./generated/prisma".
import { PrismaClient } from "./generated/prisma";

const g = global as unknown as { prisma?: PrismaClient };

export const prisma =
  g.prisma ??
  new PrismaClient({
    // Uključi query log samo u devu
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") g.prisma = prisma;
