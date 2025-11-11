import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { isObject } from "@/lib/parse";

type AccountBody = { name: string; currency: string };

function isAccountBody(x: unknown): x is AccountBody {
  return (
    isObject(x) &&
    "name" in x && typeof (x as { name: unknown }).name === "string" &&
    "currency" in x && typeof (x as { currency: unknown }).currency === "string"
  );
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, currency: true, balance: true },
  });

  return NextResponse.json(accounts);
}

/**
 * Idempotent create:
 * - ako (userId,name) postoji -> vrati postojeći (200)
 * - inače kreiraj (201)
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!isAccountBody(body)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { name, currency } = body;

  // 1) probaj dohvatiti postojeći
  const existing = await prisma.account.findUnique({
    where: { userId_name: { userId: user.id, name } },
    select: { id: true, name: true, currency: true, balance: true },
  });
  if (existing) return NextResponse.json(existing, { status: 200 });

  // 2) kreiraj (race-safe preko unique)
  try {
    const created = await prisma.account.create({
      data: { userId: user.id, name, currency, balance: 0 },
      select: { id: true, name: true, currency: true, balance: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    // ako je netko u trenu već kreirao -> vrati taj
    const fallback = await prisma.account.findUnique({
      where: { userId_name: { userId: user.id, name } },
      select: { id: true, name: true, currency: true, balance: true },
    });
    if (fallback) return NextResponse.json(fallback, { status: 200 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
