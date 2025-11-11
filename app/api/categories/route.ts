import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { isObject } from "@/lib/parse";
import { TxnType } from "@/lib/generated/prisma"; // tvoj enum

type CategoryBody = { name: string; type: "INCOME" | "EXPENSE"; icon?: string | null; color?: string | null };

function isCategoryBody(x: unknown): x is CategoryBody {
  return (
    isObject(x) &&
    "name" in x && typeof (x as { name: unknown }).name === "string" &&
    "type" in x && (x as { type: unknown }).type === "INCOME" || (x as { type: unknown }).type === "EXPENSE"
  );
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cats = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select: { id: true, name: true, type: true, icon: true, color: true, isDefault: true },
  });

  return NextResponse.json(cats);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!isCategoryBody(body)) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { name, type, icon = null, color = null } = body;
  const txType: TxnType = type === "INCOME" ? "INCOME" : "EXPENSE";

  const existing = await prisma.category.findUnique({
    where: { userId_type_name: { userId: user.id, type: txType, name } },
    select: { id: true, name: true, type: true, icon: true, color: true, isDefault: true },
  });
  if (existing) return NextResponse.json(existing, { status: 200 });

  try {
    const created = await prisma.category.create({
      data: { userId: user.id, name, type: txType, icon, color, isDefault: false },
      select: { id: true, name: true, type: true, icon: true, color: true, isDefault: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch {
    const fallback = await prisma.category.findUnique({
      where: { userId_type_name: { userId: user.id, type: txType, name } },
      select: { id: true, name: true, type: true, icon: true, color: true, isDefault: true },
    });
    if (fallback) return NextResponse.json(fallback, { status: 200 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
