// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ResetPasswordSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/crypto";

export async function POST(req: Request) {
  try {
    const { token, password } = ResetPasswordSchema.parse(await req.json());

    const rec = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!rec) return NextResponse.json({ error: "Nevažeći token" }, { status: 400 });
    if (rec.expiresAt < new Date()) return NextResponse.json({ error: "Token istekao" }, { status: 400 });

    const pwd = await hashPassword(password);
    await prisma.user.update({ where: { id: rec.userId }, data: { password: pwd } });
    await prisma.passwordResetToken.delete({ where: { id: rec.id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Bad Request" }, { status: 400 });
  }
}
