"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createPlanWizard,
  type WizardPayload,
  type GoalTypeT,
} from "@/app/actions/plan";

const ALLOWED_GOAL_TYPES = ["RETIREMENT", "PURCHASE", "BUFFER", "OTHER"] as const;
type AllowedGoalTypeLiteral = (typeof ALLOWED_GOAL_TYPES)[number];

export default function PlanWizard() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);

    const name = (formData.get("name") as string | null)?.trim() || "My Wealth Plan";
    const currency = (formData.get("currency") as string | null)?.trim() || "EUR";

    const hurdleRatePc = Number(formData.get("hurdleRatePc") ?? 10);
    const monthlyBaselineCost = Number(formData.get("monthlyBaselineCost") ?? 0);

    const goalTitle =
      (formData.get("goalTitle") as string | null)?.trim() || "Financial Independence";

    const goalTypeRaw = (formData.get("goalType") as string | null) || "OTHER";
    const targetAmount = Number(formData.get("targetAmount") ?? 0);
    const targetDateRaw = (formData.get("targetDate") as string | null) || null;

    // Sigurno sužavanje na enum: ako nije dozvoljeno -> OTHER
    const goalTypeLit: AllowedGoalTypeLiteral = ALLOWED_GOAL_TYPES.includes(
      goalTypeRaw as AllowedGoalTypeLiteral,
    )
      ? (goalTypeRaw as AllowedGoalTypeLiteral)
      : "OTHER";

    const payload: WizardPayload = {
      name,
      currency,
      hurdleRatePc,
      monthlyBaselineCost,
      goalTitle,
      goalType: goalTypeLit as GoalTypeT,
      targetAmount,
      targetDate: targetDateRaw,
    };

    startTransition(async () => {
      try {
        await createPlanWizard(payload);
        router.replace("/dashboard");
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to create plan. Please try again.",
        );
      }
    });
  }

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Create your Wealth Plan</h1>

      <form action={onSubmit} className="space-y-6">
        {/* Plan basics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-sm font-medium">Plan name</label>
            <input name="name" defaultValue="My Wealth Plan" className="input" />
          </div>
          <div>
            <label className="text-sm font-medium">Currency</label>
            <input name="currency" defaultValue="EUR" className="input" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Hurdle rate %</label>
            <input
              name="hurdleRatePc"
              defaultValue={10}
              className="input"
              type="number"
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Monthly baseline cost</label>
            <input
              name="monthlyBaselineCost"
              placeholder="e.g. rent + food etc."
              className="input"
              type="number"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        {/* Goal */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-sm font-medium">Goal title</label>
            <input
              name="goalTitle"
              defaultValue="Financial Independence"
              className="input"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Goal type</label>
            <select name="goalType" defaultValue="OTHER" className="input">
              <option value="RETIREMENT">Retirement</option>
              <option value="PURCHASE">Purchase</option>
              <option value="BUFFER">Buffer</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Target amount</label>
            <input
              name="targetAmount"
              placeholder="e.g. 300000"
              className="input"
              type="number"
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Target date (optional)</label>
            <input name="targetDate" className="input" type="date" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending ? "Creating..." : "Create plan"}
        </button>
      </form>
    </main>
  );
}
