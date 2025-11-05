import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/cookies";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // Brišemo kolačić u svim uvjetima
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return res;
}
