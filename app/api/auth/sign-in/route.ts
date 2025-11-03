// app/api/auth/sign-in/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/cookies";
import bcrypt from "bcryptjs"; // ili 'bcrypt' — ali nemoj oba u package.json

type Body =
  | { email: string; password: string }
  | { username: string; password: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!("password" in body)) {
      return NextResponse.json(
        { message: "Password is required." },
        { status: 400 }
      );
    }

    const where =
      "email" in body
        ? { email: body.email.toLowerCase() }
        : { username: body.username };

    const user = await prisma.user.findUnique({ where });
    if (!user) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    const ok = await bcrypt.compare(body.password, user.password);
    if (!ok) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    const { token, expiresAt } = await createSession(user.id);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));

    return res;
  } catch (err) {
    console.error("sign-in error", err);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
