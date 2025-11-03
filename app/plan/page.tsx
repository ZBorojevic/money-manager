"use server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import type { $Enums } from "@prisma/client";

/** Prisma enum tip koji ćemo koristiti i na klijentu */
export type GoalTypeT = $Enums.GoalType;

export type WizardPayload = {
  name: string;
  currency: string;
  hurdleRatePc: number;
  monthlyBaselineCost: number;
  goalTitle: string;
  goalType: GoalTypeT;
  targetAmount: number;
  /** ISO date string (yyyy-mm-dd) ili null */
  targetDate?: string | null;
};

export async function createPlanWizard(payload: WizardPayload) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  // Plan (upsert po (userId, name) unique kompozitnom ključu)
  const plan = await prisma.plan.upsert({
    where: { userId_name: { userId: user.id, name: payload.name } },
    update: {
      currency: payload.currency,
      hurdleRatePc: payload.hurdleRatePc,
      updatedAt: new Date(),
    },
    create: {
      userId: user.id,
      name: payload.name,
      currency: payload.currency,
      hurdleRatePc: payload.hurdleRatePc,
    },
  });

  // Po jednostavnosti: kreiramo jedan goal (možemo kasnije dodati edit/upsert logiku)
  await prisma.goal.create({
    data: {
      userId: user.id,
      planId: plan.id,
      type: payload.goalType,
      title: payload.goalTitle,
      targetAmount: payload.targetAmount,
      targetDate: payload.targetDate ? new Date(payload.targetDate) : null,
    },
  });

  // Spremajmo baseline u postavke (Json)
  await prisma.setting.upsert({
    where: { userId_key: { userId: user.id, key: "monthlyBaselineCost" } },
    update: { value: payload.monthlyBaselineCost },
    create: {
      userId: user.id,
      key: "monthlyBaselineCost",
      value: payload.monthlyBaselineCost,
    },
  });

  return { ok: true, planId: plan.id };
}
