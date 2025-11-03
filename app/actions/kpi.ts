// app/actions/kpi.ts
"use server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { computeMonthKpis, periodStart } from "@/lib/pace/calc";

export async function getOrCreateMonthlySnapshot() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const now = new Date();
  const start = periodStart("month", now);
  const y = start.getFullYear();
  const m = start.getMonth() + 1;

  let snap = await prisma.kpiSnapshot.findUnique({
    where: { userId_year_month: { userId: user.id, year: y, month: m } },
  });

  if (!snap) {
    const plan = await prisma.plan.findFirst({ where: { userId: user.id } });
    const hurdleRatePc = Number(plan?.hurdleRatePc ?? 10);

    const kpis = await computeMonthKpis({ monthStart: start, userId: user.id, hurdleRatePc });
    snap = await prisma.kpiSnapshot.create({
      data: {
        userId: user.id,
        year: y,
        month: m,
        income: kpis.income,
        expenses: kpis.expenses,
        savings: kpis.savings,
        savingsRatePc: Math.round(kpis.savingsRate * 100),
        runwayMonths: kpis.runwayMonths,
        paceScore: kpis.paceScore,
      },
    });
  }

  return snap;
}
