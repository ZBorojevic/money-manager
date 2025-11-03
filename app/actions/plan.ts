// app/actions/plan.ts
"use server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { PlanWizardSchema } from "@/lib/validation/plan";
import { GoalType as PrismaGoalType } from "@/lib/generated/prisma";

export async function createPlanWizard(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const input = PlanWizardSchema.parse({
    name: formData.get("name"),
    currency: formData.get("currency"),
    hurdleRatePc: formData.get("hurdleRatePc"),
    goalTitle: formData.get("goalTitle"),
    goalType: formData.get("goalType"),
    targetAmount: formData.get("targetAmount"),
    targetDate: formData.get("targetDate") || undefined,
    monthlyBaselineCost: formData.get("monthlyBaselineCost"),
    taxRatePc: formData.get("taxRatePc"),
    engineYieldPc: formData.get("engineYieldPc"),
  });

  // jednostavni obračun potrebne mjesečne uplate (ako je zadan rok)
  let monthlyNeed: number | null = null;
  if (input.targetDate) {
    const now = new Date();
    const months =
      (input.targetDate.getFullYear() - now.getFullYear()) * 12 +
      (input.targetDate.getMonth() - now.getMonth());
    const futureReq = input.targetAmount;
    monthlyNeed = months > 0 ? futureReq / months : futureReq;
  }

  const plan = await prisma.plan.create({
    data: {
      userId: user.id,
      name: input.name,
      currency: input.currency,
      hurdleRatePc: input.hurdleRatePc,
      goals: {
        create: [
          {
            userId: user.id,
            type: input.goalType as PrismaGoalType,
            title: input.goalTitle,
            targetAmount: input.targetAmount,
            targetDate: input.targetDate ?? null,
            monthlyNeed: monthlyNeed ?? undefined,
          },
        ],
      },
    },
    include: { goals: true },
  });

  // baseline cost → runway kalkulacije
  await prisma.setting.upsert({
    where: { userId_key: { userId: user.id, key: "monthly_baseline_cost" } },
    update: { value: input.monthlyBaselineCost },
    create: {
      userId: user.id,
      key: "monthly_baseline_cost",
      value: input.monthlyBaselineCost,
    },
  });

  // default nudge pravilo
  await prisma.nudgeRule.upsert({
    where: { userId_code: { userId: user.id, code: "SAVINGS_RATE_LOW" } },
    update: { threshold: 0.3 },
    create: { userId: user.id, code: "SAVINGS_RATE_LOW", threshold: 0.3 },
  });

  return { ok: true, planId: plan.id, goalId: plan.goals[0].id };
}
