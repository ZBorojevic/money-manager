import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { parseAmountToDecimalString } from "@/lib/money";
import { TxnType } from "@/lib/generated/prisma";

// ... GET ostaje isto ...

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accountId, categoryId, type, amount, currency, occurredAt, note } = await req.json();

  if (!accountId || !type || !amount || !occurredAt) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (type !== "INCOME" && type !== "EXPENSE") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const acc = await prisma.account.findUnique({ where: { id: accountId } });
  if (!acc || acc.userId !== user.id) return NextResponse.json({ error: "Invalid account" }, { status: 400 });

  const decimalAmount = parseAmountToDecimalString(String(amount));
  const currencyFinal = currency ?? acc.currency ?? "EUR";

  const tx = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId,
      categoryId: categoryId ?? null,
      type: type as TxnType,
      amount: decimalAmount,
      currency: currencyFinal,
      occurredAt: new Date(occurredAt),
      note: note ?? null,
    },
    include: { category: true, account: true }
  });

  // Pace placeholder (KpiSnapshot) – isti blok kao ranije…

  const d = new Date(occurredAt);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;

  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId: user.id, type: TxnType.INCOME, occurredAt: { gte: new Date(Date.UTC(year, month-1, 1)), lt: new Date(Date.UTC(year, month, 1)) } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: user.id, type: TxnType.EXPENSE, occurredAt: { gte: new Date(Date.UTC(year, month-1, 1)), lt: new Date(Date.UTC(year, month, 1)) } },
      _sum: { amount: true },
    }),
  ]);

  const income = incomeAgg._sum.amount ?? 0;
  const expenses = expenseAgg._sum.amount ?? 0;
  const savings = Number(income) - Number(expenses);
  const savingsRatePc = Number(income) > 0 ? (savings / Number(income)) * 100 : 0;
  const runwayMonths = Number(expenses) > 0 ? Math.max(0, Number((savings > 0 ? savings : 0) / Number(expenses))) : 0;
  const paceScore = Math.max(0, Math.min(100, Math.round(50 + (savingsRatePc - 20))));

  await prisma.kpiSnapshot.upsert({
    where: { userId_year_month: { userId: user.id, year, month } },
    update: { income, expenses, savings, savingsRatePc, runwayMonths, paceScore },
    create: { userId: user.id, year, month, income, expenses, savings, savingsRatePc, runwayMonths, paceScore },
  });

  return NextResponse.json(tx, { status: 201 });
}
