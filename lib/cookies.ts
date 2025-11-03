// lib/cookies.ts
import { cookies } from "next/headers";

/** Name of the session cookie */
export const SESSION_COOKIE =
  process.env.SESSION_COOKIE_NAME ?? "mm_session";

/**
 * Cookie options for setting a session (only from route handlers).
 */
export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

/** Options for deleting the cookie. */
export const deleteCookieOptions = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 0,
  expires: new Date(0),
};

// ---------- Cookie store helpers ----------

/** Tip koji odgovara onome što dobivamo iz `cookies()` ili `req.cookies`. */
type SimpleCookieStore = {
  get: (name: string) => { value?: string } | undefined;
};

type CookieStore = Awaited<ReturnType<typeof cookies>>;

/** Mali type-guard za Promise detekciju bez `any`. */
function isPromise<T>(v: T | Promise<T>): v is Promise<T> {
  return typeof (v as unknown as { then?: unknown }).then === "function";
}

/** Dohvati trenutni cookie store (uvijek kao Promise). */
export async function getCookieStore(): Promise<CookieStore> {
  return await cookies();
}

/**
 * Read session token from cookies.
 * Prihvaća:
 *  - ništa (sam će pozvati `cookies()`)
 *  - `cookies()` (sync ili async)
 *  - `req.cookies` iz middlewarea/route handlera
 */
export async function getSessionToken(
  store?: CookieStore | Promise<CookieStore> | SimpleCookieStore
): Promise<string | null> {
  let c: SimpleCookieStore;

  if (!store) {
    c = await cookies();
  } else if (isPromise(store)) {
    c = await store;
  } else {
    c = store;
  }

  const hit = c.get(SESSION_COOKIE);
  const value = hit?.value;
  return value ?? null;
}
