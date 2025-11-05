import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cats = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: [{ type: "asc" }, { name: "asc" }]
  });
  return NextResponse.json(cats);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, type, icon, color } = await req.json();
  if (!name || (type !== "INCOME" && type !== "EXPENSE")) {
    return NextResponse.json({ error: "Invalid inputs" }, { status: 400 });
  }

  const created = await prisma.category.create({
    data: { userId: user.id, name, type, icon: icon ?? null, color: color ?? null, isDefault: false }
  });

  return NextResponse.json(created, { status: 201 });
}
