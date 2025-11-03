// app/api/auth/sign-out/route.ts
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/cookies";

export async function POST() {
  const res = NextResponse.redirect("/");
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });
  return res;
}
