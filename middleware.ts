// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/cookies";

const PROTECTED = ["/dashboard", "/plan", "/invest", "/analyze"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Štiti samo PROTECTED rute
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const url = new URL("/sign-in", req.url);
    // očuvaj target
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/plan/:path*", "/invest/:path*", "/analyze/:path*"],
};
