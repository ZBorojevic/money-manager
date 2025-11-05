import { prisma } from "@/lib/prisma";
import { TxnType } from "../lib/generated/prisma";

const DEFAULT_CATEGORIES = {
  INCOME: ["Salary", "Bonus", "Interest"],
  EXPENSE: ["Food", "Transport", "Rent", "Utilities", "Entertainment"],
};

export async function createDefaultCategoriesForUser(userId: string) {
  const data = [
    ...DEFAULT_CATEGORIES.INCOME.map((name) => ({
      userId, name, type: TxnType.INCOME, isDefault: true,
    })),
    ...DEFAULT_CATEGORIES.EXPENSE.map((name) => ({
      userId, name, type: TxnType.EXPENSE, isDefault: true,
    })),
  ];
  await prisma.category.createMany({ data, skipDuplicates: true });
}

export async function ensureDefaultAccount(userId: string) {
  const hasAny = await prisma.account.findFirst({ where: { userId } });
  if (!hasAny) {
    await prisma.account.create({
      data: { userId, name: "Main", currency: "EUR", balance: 0 },
    });
  }
}
