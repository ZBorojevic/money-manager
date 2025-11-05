"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname.startsWith("/dashboard");

  return (
    <div className="min-h-svh bg-neutral-50 text-neutral-900">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col w-56 border-r bg-white fixed inset-y-0">
        <div className="p-4 flex items-center gap-2 border-b">
          <Image src="/logo.svg" alt="Logo" width={28} height={28} />
          <div className="font-semibold">Money Manager</div>
        </div>

        <nav className="p-2 space-y-1 flex-1">
          <Link
            href="/dashboard"
            className={clsx(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
              active ? "bg-black text-white" : "hover:bg-neutral-100"
            )}
          >
            <span>🏠</span>
            <span>Dashboard</span>
          </Link>
        </nav>

        <div className="p-3 border-t">
          {/* Ako imaš vlastitu SignOut komponentu — zamijeni ovaj Link */}
          <Link href="/sign-out" className="text-sm underline">Sign out</Link>
        </div>
      </aside>

      {/* Mobile topbar */}
      <header className="lg:hidden sticky top-0 bg-white border-b z-20 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Logo" width={24} height={24} />
          <span className="font-semibold">Money Manager</span>
        </div>
        <Link href="/sign-out" className="text-sm underline">Sign out</Link>
      </header>

      {/* Content */}
      <main className="lg:ml-56 p-4 lg:p-8">{children}</main>

      {/* Bottom nav (mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-20">
        <Link
          href="/dashboard"
          className={clsx(
            "h-12 flex flex-col items-center justify-center text-xs",
            active ? "text-black" : "text-neutral-500"
          )}
        >
          <div className="text-base">🏠</div>
          Dashboard
        </Link>
      </nav>
    </div>
  );
}
