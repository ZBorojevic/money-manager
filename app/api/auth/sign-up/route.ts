// app/api/auth/sign-up/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SignUpSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/crypto";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = SignUpSchema.parse(json);

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (exists) {
      return NextResponse.json({ error: "Email ili korisničko ime već postoji" }, { status: 409 });
    }

    const password = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    // email verification token (24h)
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.emailVerificationToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    await sendVerificationEmail(user.email, token);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Bad Request" }, { status: 400 });
  }
}
