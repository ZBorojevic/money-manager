// app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { getSessionUser } from "@/lib/session";

export default async function LandingPage() {
  const user = await getSessionUser();
  const href = user ? "/dashboard" : "/sign-in";

  return (
    <main className="min-h-svh flex items-center justify-center p-6">
      <div className="w-full max-w-md mx-auto text-center">
        <div className="flex justify-center mb-8">
          <Image src="/logo.svg" alt="Money Manager" width={64} height={64} priority />
        </div>

        <h1 className="text-2xl font-semibold mb-2">Money Manager</h1>
        <p className="text-sm text-slate-600 mb-6">
          Track your income and expenses with ease.
        </p>

        <Link
          href={href}
          className="inline-flex w-full items-center justify-center rounded-xl border px-4 py-2 font-medium"
        >
          Start app
        </Link>

        <div className="mt-6 text-xs text-slate-500">
          Tip: Add to Home Screen to use it like a native app.
        </div>
        <div className="mt-6 text-xs text-slate-500">
          version 0.1.0
        </div>
      </div>
    </main>
  );
}
