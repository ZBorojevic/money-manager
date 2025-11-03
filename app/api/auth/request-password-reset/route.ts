// app/api/auth/request-password-reset/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ResetRequestSchema } from "@/lib/validation";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = ResetRequestSchema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email } });

    // uvijek vraćamo OK
    if (user) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
      await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });
      await sendPasswordResetEmail(email, token);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Bad Request" }, { status: 400 });
  }
}
