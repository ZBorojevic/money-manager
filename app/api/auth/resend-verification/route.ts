// app/api/auth/resend-verification/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req: Request) {
  const { email } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ ok: true }); // ne otkrivamo postojanje

  if (user.isVerified) return NextResponse.json({ ok: true });

  // ukloni stare tokene
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({ data: { token, userId: user.id, expiresAt } });
  await sendVerificationEmail(user.email, token);

  return NextResponse.json({ ok: true });
}
