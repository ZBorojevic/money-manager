import { prisma } from "@/lib/prisma";
import { TxnType } from "@/lib/generated/prisma";

// Idempotentno: kreira što nedostaje i ništa ne duplira
export async function ensureUserBootstrap(userId: string) {
  // 1) Account: Main
  const main = await prisma.account.findFirst({ where: { userId, name: "Main" } });
  if (!main) {
    await prisma.account.create({
      data: { userId, name: "Main", currency: "EUR", balance: 0 },
    });
  }

  // 2) Default kategorije (po tipu)
  const existing = await prisma.category.findMany({ where: { userId } });
  const haveIncome = new Set(existing.filter(c => c.type === "INCOME").map(c => c.name.toLowerCase()));
  const haveExpense = new Set(existing.filter(c => c.type === "EXPENSE").map(c => c.name.toLowerCase()));

  const income = ["Salary", "Bonus", "Interest"].filter(n => !haveIncome.has(n.toLowerCase()))
    .map(name => ({ userId, name, type: TxnType.INCOME, isDefault: true }));

  const expense = ["Food", "Transport", "Rent", "Utilities", "Entertainment"]
    .filter(n => !haveExpense.has(n.toLowerCase()))
    .map(name => ({ userId, name, type: TxnType.EXPENSE, isDefault: true }));

  if (income.length || expense.length) {
    await prisma.category.createMany({ data: [...income, ...expense], skipDuplicates: true });
  }
}
