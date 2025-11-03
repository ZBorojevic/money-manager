// lib/pace/calc.ts
import { prisma } from "@/lib/db";

/** Granica perioda (day/week/month/year) od zadanog datuma */
export function periodStart(
  period: "day" | "week" | "month" | "year",
  base: Date = new Date()
): Date {
  const d = new Date(base);
  if (period === "day") d.setHours(0, 0, 0, 0);
  if (period === "week") {
    const day = d.getDay();
    const diff = (day + 6) % 7; // ponedjeljak kao početak
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
  }
  if (period === "month") {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
  }
  if (period === "year") {
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

export type MonthKpis = {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number; // 0..1
  runwayMonths: number;
  hasConsumerDebt: boolean;
  hurdleRatePc: number;
  goalScore: number;
  srScore: number;
  bufferScore: number;
  debtScore: number;
  paceScore: number; // 0..100
};

export type PaceInputs = {
  monthStart: Date;
  userId: string;
  hurdleRatePc?: number; // default 10
};

/** Izračuna KPI-je za tekući mjesec i PACE skor. */
export async function computeMonthKpis({
  monthStart,
  userId,
  hurdleRatePc = 10,
}: PaceInputs): Promise<MonthKpis> {
  const [incomeAgg, expenseAgg, cashHoldings, liabilities, settings] =
    await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { userId, type: "INCOME", occurredAt: { gte: monthStart } },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { userId, type: "EXPENSE", occurredAt: { gte: monthStart } },
      }),
      prisma.holding.aggregate({
        _sum: { amount: true },
        where: { userId, assetClass: "CASH" },
      }),
      prisma.liability.findMany({ where: { userId } }),
      prisma.setting.findMany({ where: { userId } }),
    ]);

  const getNumericSetting = (key: string, fallback: number): number => {
    const s = settings.find((x) => x.key === key);
    if (s?.value === null || s?.value === undefined) return fallback;
    const num = Number(s?.value as unknown);
    return Number.isFinite(num) ? num : fallback;
    };

  const income = Number(incomeAgg._sum.amount ?? 0);
  const expenses = Number(expenseAgg._sum.amount ?? 0);
  const savings = Math.max(income - expenses, 0);
  const savingsRate = income > 0 ? savings / income : 0;

  const monthlyCost =
    getNumericSetting("monthly_baseline_cost", 0) || Math.max(expenses, 1);
  const cash = Number(cashHoldings._sum.amount ?? 0);
  const runwayMonths = cash / monthlyCost;

  const hasConsumerDebt = liabilities.some((l) =>
    ["CREDIT_CARD", "CONSUMER_LOAN"].includes(l.type)
  );

  const activeGoal = await prisma.goal.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  let goalScore = 0;
  if (activeGoal) {
    const required = Number(activeGoal.monthlyNeed ?? 0);
    if (required <= 0) goalScore = 20;
    else {
      const ratio = savings / required; // 1 === on track
      if (ratio >= 1) goalScore = 20;
      else if (ratio >= 0.9) goalScore = 15;
      else if (ratio >= 0.75) goalScore = 8;
      else if (ratio >= 0.5) goalScore = 4;
      else goalScore = 1;
    }
  }

  // 0–40 bodova za savings rate (50% ⇒ 40b)
  const srScore = Math.round(
    Math.max(0, Math.min(40, (savingsRate * 40) / 0.5))
  );
  const debtScore = hasConsumerDebt ? 0 : 15;
  const bufferScore =
    runwayMonths >= 12
      ? 15
      : runwayMonths >= 6
      ? 10
      : runwayMonths >= 3
      ? 5
      : runwayMonths >= 1
      ? 2
      : 0;

  const paceScoreRaw = srScore + debtScore + bufferScore + goalScore;
  const paceScore = Math.min(
    hasConsumerDebt ? 60 : 100,
    Math.min(100, paceScoreRaw)
  );

  return {
    income,
    expenses,
    savings,
    savingsRate,
    runwayMonths,
    hasConsumerDebt,
    hurdleRatePc,
    goalScore,
    srScore,
    bufferScore,
    debtScore,
    paceScore,
  };
}
