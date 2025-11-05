import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { TxnType, Prisma } from "@/lib/generated/prisma";

type CategoryBody = { name: string; type: "INCOME" | "EXPENSE"; icon?: string; color?: string };

function isCategoryBody(x: unknown): x is CategoryBody {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.name === "string" &&
    (o.type === "INCOME" || o.type === "EXPENSE") &&
    (o.icon === undefined || typeof o.icon === "string") &&
    (o.color === undefined || typeof o.color === "string")
  );
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cats = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(cats);
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
  if (!isCategoryBody(bodyUnknown)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { name, type, icon, color } = bodyUnknown;

  try {
    const created = await prisma.category.create({
      data: {
        userId: user.id,
        name,
        type: type as TxnType,
        icon: icon ?? null,
        color: color ?? null,
        isDefault: false,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }
    console.error("POST /api/categories error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
