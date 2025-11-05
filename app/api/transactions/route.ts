import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { parseAmountToDecimalString } from "@/lib/money";
import { TxnType, Prisma } from "@/lib/generated/prisma";

type TxBody = {
  accountId: string;
  categoryId?: string;
  type: "INCOME" | "EXPENSE";
  amount: string | number;
  currency?: string;
  occurredAt: string; // ISO ili yyyy-mm-dd
  note?: string;
};

function isTxBody(x: unknown): x is TxBody {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  const typeOk = o.type === "INCOME" || o.type === "EXPENSE";
  const amtOk = typeof o.amount === "string" || typeof o.amount === "number";
  return (
    typeof o.accountId === "string" &&
    typeof o.occurredAt === "string" &&
    typeOk &&
    amtOk &&
    (o.categoryId === undefined || typeof o.categoryId === "string") &&
    (o.currency === undefined || typeof o.currency === "string") &&
    (o.note === undefined || typeof o.note === "string")
  );
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? "50");
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 50, 1), 200);

  const data = await prisma.transaction.findMany({
    where: { userId: user.id },
    include: { category: true, account: true },
    orderBy: { occurredAt: "desc" },
    take: limit,
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let bodyUnknown: unknown;
  try {
    bodyUnknown = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!isTxBody(bodyUnknown)) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const { accountId, categoryId, type, amount, currency, occurredAt, note } = bodyUnknown;

  const acc = await prisma.account.findUnique({ where: { id: accountId } });
  if (!acc || acc.userId !== user.id) {
    return NextResponse.json({ error: "Invalid account" }, { status: 400 });
  }

  try {
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
      include: { category: true, account: true },
    });

    return NextResponse.json(tx, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma error:", e.code, e.meta);
    } else {
      console.error("POST /api/transactions error:", e);
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
