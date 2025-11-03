// app/api/auth/verify-email/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const { token } = await req.json();

  const rec = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!rec) return NextResponse.json({ error: "Nevažeći token" }, { status: 400 });
  if (rec.expiresAt < new Date()) return NextResponse.json({ error: "Token istekao" }, { status: 400 });

  await prisma.user.update({ where: { id: rec.userId }, data: { isVerified: true } });
  await prisma.emailVerificationToken.delete({ where: { id: rec.id } });

  return NextResponse.json({ ok: true });
}
