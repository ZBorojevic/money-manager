"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import Image from "next/image";
import clsx from "clsx";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/transactions", label: "Transactions", icon: "📒" },
  { href: "/categories", label: "Categories", icon: "🏷️" },
  { href: "/accounts", label: "Accounts", icon: "💳" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-svh bg-neutral-50 text-neutral-900">
      {/* Top bar (mobile) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Logo" width={24} height={24} />
            <span className="font-semibold">Money Manager</span>
          </div>
          {/* koristi postojeću sign-out rutu (već je imaš) */}
          <Link href="/sign-out" className="text-sm underline">Sign out</Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[220px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block sticky top-0 h-svh border-r bg-white">
          <div className="p-4 flex items-center gap-2 border-b">
            <Image src="/logo.svg" alt="Logo" width={28} height={28} />
            <div className="font-semibold">Money Manager</div>
          </div>
          <nav className="p-2 space-y-1">
            {NAV.map(item => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
                    active ? "bg-black text-white" : "hover:bg-neutral-100"
                  )}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-3 mt-auto">
            <Link href="/sign-out" className="text-sm underline">Sign out</Link>
          </div>
        </aside>

        {/* Main */}
        <main className="px-4 lg:px-8 py-6">{children}</main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="grid grid-cols-4">
          {NAV.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "h-12 flex flex-col items-center justify-center text-xs",
                  active ? "text-black" : "text-neutral-500"
                )}
              >
                <div className="text-base">{item.icon}</div>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
