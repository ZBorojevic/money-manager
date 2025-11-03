import { randomBytes } from "crypto";
import { prisma } from "./db";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/cookies";

const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS ?? "720"); // 30 dana

export async function createSession(userId: string) {
  const token = randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  await prisma.session.create({
    data: { token, userId, expiresAt },
  });

  return { token, expiresAt };
}

export async function revokeSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

export async function getSession(token: string | undefined | null) {
  if (!token) return null;
  return prisma.session.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
    include: { user: true },
  });
}

/**
 * Server-side helper: pročitaj session iz kolačića (za Server Components, route handlere, layout itd.)
 * Radi s Next 15 gdje cookies() može biti async.
 */
export async function getSessionFromCookies() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return getSession(token ?? null);
}

/**
 * Najčešće što trebaš u layout/page: direktno vrati usera ili null.
 * Ovo je ono što ti je falilo: `getSessionUser`.
 */
export async function getSessionUser() {
  const session = await getSessionFromCookies();
  return session?.user ?? null;
}

