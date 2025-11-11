import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { parseMoney, parseISODate, isObject } from "@/lib/parse";
import { TxnType } from "@/lib/generated/prisma";

type TxBody = {
  type: "INCOME" | "EXPENSE";
  accountId: string;
  categoryId?: string | null;
  amount: string | number; // "100,00" ili 100
  currency?: string;
  occurredAt: string; // ISO ili "YYYY-MM-DD"
  note?: string | null;
};

function isTxBody(x: unknown): x is TxBody {
  return (
    isObject(x) &&
    "type" in x &&
    ((x as { type: unknown }).type === "INCOME" || (x as { type: unknown }).type === "EXPENSE") &&
    "accountId" in x && typeof (x as { accountId: unknown }).accountId === "string" &&
    "amount" in x &&
    ("occurredAt" in x && typeof (x as { occurredAt: unknown }).occurredAt === "string")
  );
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const txs = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { occurredAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      amount: true,
      currency: true,
      occurredAt: true,
      note: true,
      account: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, type: true } },
    },
  });

  return NextResponse.json(txs);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!isTxBody(body)) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const type: TxnType = body.type === "INCOME" ? "INCOME" : "EXPENSE";
  const amount = parseMoney(body.amount);
  const occurredAt = parseISODate(body.occurredAt);
  const currency = body.currency ?? "EUR";

  // provjeri da account pripada useru
  const account = await prisma.account.findFirst({ where: { id: body.accountId, userId: user.id } });
  if (!account) return NextResponse.json({ error: "Invalid account" }, { status: 400 });

  if (body.categoryId) {
    const cat = await prisma.category.findFirst({ where: { id: body.categoryId, userId: user.id, type } });
    if (!cat) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const created = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: body.accountId,
      categoryId: body.categoryId ?? null,
      type,
      amount,
      currency,
      occurredAt,
      note: body.note ?? null,
    },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
