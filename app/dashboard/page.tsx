import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { ensureUserDefaults } from "@/lib/defaults";
import Dashboard, { TxRow } from "@/components/dashboard";
import { redirect } from "next/navigation";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  // osiguraj Main + default kategorije
  await ensureUserDefaults(user.id);

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [incomeAgg, expenseAgg, recent] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { userId: user.id, type: "INCOME", occurredAt: { gte: start, lt: end } },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { userId: user.id, type: "EXPENSE", occurredAt: { gte: start, lt: end } },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      include: { category: true },
      orderBy: { occurredAt: "desc" },
      take: 10,
    }),
  ]);

  const income = Number(incomeAgg._sum.amount ?? 0);
  const expenses = Number(expenseAgg._sum.amount ?? 0);
  const balance = income - expenses;

  const rows: TxRow[] = recent.map((t) => ({
    id: t.id,
    name: t.category?.name ?? "Uncategorized",
    amount: Number(t.amount),
    type: t.type === "INCOME" ? "income" : "expense",
    date: t.occurredAt.toISOString().slice(0, 10),
  }));

  return <Dashboard income={income} expenses={expenses} balance={balance} transactions={rows} />;
}
