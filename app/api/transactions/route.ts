// app/api/transactions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    type,            // "INCOME" | "EXPENSE"
    accountId,       // string
    categoryId,      // string
    amount,          // number
    currency,        // string
    date,            // "YYYY-MM-DD"
    note,            // string | null
  } = body ?? {};

  if (!type || !accountId || !categoryId || !amount || !currency || !date) {
    return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
  }

  await prisma.transaction.create({
    data: {
      userId: user.id,
      type,
      accountId,
      categoryId,
      amount,
      currency,
      occurredAt: new Date(date + "T00:00:00Z"),
      note: note ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
