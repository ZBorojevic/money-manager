import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

type AccountBody = { name: string; currency: string };
const isAccountBody = (x: unknown): x is AccountBody =>
  typeof x === "object" && x !== null &&
  typeof (x as any).name === "string" &&
  typeof (x as any).currency === "string";

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

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!isAccountBody(body)) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { name, currency } = body;

  try {
    // prvo provjera – ako postoji, vrati ga (idempotentno)
    const existing = await prisma.account.findUnique({
      where: { userId_name: { userId: user.id, name } },
      select: { id: true, name: true, currency: true, balance: true },
    });
    if (existing) return NextResponse.json(existing, { status: 200 });

    // inače kreiraj
    const created = await prisma.account.create({
      data: { userId: user.id, name, currency, balance: 0 },
      select: { id: true, name: true, currency: true, balance: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as any).code : undefined;
    if (code === "P2002") {
      // fallback ako je trka: dohvatite i vratite postojeći
      const acc = await prisma.account.findUnique({
        where: { userId_name: { userId: user.id, name } },
        select: { id: true, name: true, currency: true, balance: true },
      });
      if (acc) return NextResponse.json(acc, { status: 200 });
      return NextResponse.json({ error: "Account already exists" }, { status: 409 });
    }
    console.error("POST /api/accounts error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
