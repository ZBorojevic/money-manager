// lib/validation/plan.ts
import { z } from "zod";

export const PlanWizardSchema = z.object({
  name: z.string().min(1).default("My Wealth Plan"),
  currency: z.string().length(3).default("EUR"),
  hurdleRatePc: z.coerce.number().positive().default(10),
  goalTitle: z.string().min(1).default("Financial Independence"),
  goalType: z.enum(["RETIREMENT","PURCHASE","BUFFER","OTHER"]).default("RETIREMENT"),
  targetAmount: z.coerce.number().positive(),
  targetDate: z.coerce.date().optional(),
  monthlyBaselineCost: z.coerce.number().positive(), // za runway/setting
  taxRatePc: z.coerce.number().min(0).max(60).default(20),
  engineYieldPc: z.coerce.number().min(1).max(20).default(4), // npr. "4% rule"
});
export type PlanWizardInput = z.infer<typeof PlanWizardSchema>;
