import { prisma } from "@/lib/prisma";
import { TxnType } from "@/lib/generated/prisma";

/**
 * Idempotentno i “hard”:
 * - upsert za Account(Main)
 * - createMany za default kategorije (skipDuplicates)
 */
export async function ensureUserBootstrap(userId: string) {
  // Account: Main (EUR) — koristi composite unique @@unique([userId, name])
  await prisma.account.upsert({
    where: { userId_name: { userId, name: "Main" } },
    update: {},
    create: { userId, name: "Main", currency: "EUR", balance: 0 },
  });

  // Default kategorije
  const existing = await prisma.category.findMany({ where: { userId } });
  const have = new Set(existing.map(c => `${c.type}:${c.name}`.toLowerCase()));

  const income = ["Salary", "Bonus", "Interest"]
    .filter(n => !have.has(`INCOME:${n}`.toLowerCase()))
    .map(name => ({ userId, name, type: TxnType.INCOME, isDefault: true }));

  const expense = ["Food", "Transport", "Rent", "Utilities", "Entertainment"]
    .filter(n => !have.has(`EXPENSE:${n}`.toLowerCase()))
    .map(name => ({ userId, name, type: TxnType.EXPENSE, isDefault: true }));

  if (income.length || expense.length) {
    await prisma.category.createMany({ data: [...income, ...expense], skipDuplicates: true });
  }
}
