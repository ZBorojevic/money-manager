import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, currency: true },
  });
  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, currency } = await req.json();
  if (!name || !currency) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const created = await prisma.account.create({
    data: { userId: user.id, name, currency, balance: 0 },
  });
  return NextResponse.json(created, { status: 201 });
}
