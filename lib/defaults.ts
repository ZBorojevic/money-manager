import { prisma } from "@/lib/prisma";
import { TxnType } from "@/lib/generated/prisma";

export async function ensureUserDefaults(userId: string) {
  // 1) Account: Main
  const main = await prisma.account.findUnique({
    where: { userId_name: { userId, name: "Main" } },
    select: { id: true },
  });
  if (!main) {
    await prisma.account.create({
      data: { userId, name: "Main", currency: "EUR", balance: 0 },
    });
  }

  // 2) Categories (idempotent)
  const defaults: Array<{ name: string; type: TxnType }> = [
    { name: "Salary", type: TxnType.INCOME },
    { name: "Freelance", type: TxnType.INCOME },
    { name: "Rent", type: TxnType.EXPENSE },
    { name: "Groceries", type: TxnType.EXPENSE },
    { name: "Transport", type: TxnType.EXPENSE },
  ];

  for (const c of defaults) {
    const exists = await prisma.category.findUnique({
      where: { userId_type_name: { userId, type: c.type, name: c.name } },
      select: { id: true },
    });
    if (!exists) {
      await prisma.category.create({
        data: { userId, name: c.name, type: c.type, isDefault: true },
      });
    }
  }
}
