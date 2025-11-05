// app/api/transactions/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Decimal } from "@prisma/client/runtime/library";

const CreateTx = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  accountId: z.string().min(1),
  categoryId: z.string().min(1),
  amount: z.string().refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, {
    message: "Amount must be a positive number",
  }),
  currency: z.string().min(1).default("EUR"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const input = CreateTx.parse(body);

    const [acc, cat] = await Promise.all([
      prisma.account.findFirst({ where: { id: input.accountId, userId: user.id } }),
      prisma.category.findFirst({ where: { id: input.categoryId, userId: user.id, type: input.type } }),
    ]);
    if (!acc) return NextResponse.json({ message: "Account not found" }, { status: 404 });
    if (!cat) return NextResponse.json({ message: "Category not found" }, { status: 404 });

    const created = await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: acc.id,
        categoryId: cat.id,
        type: input.type,
        amount: new Decimal(input.amount),
        currency: input.currency || acc.currency || "EUR",
        occurredAt: new Date(input.date + "T00:00:00Z"),
        note: input.note ?? null,
      },
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
