// app/dashboard/layout.tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import AppNav from "@/components/nav/app-nav";
import SignOutButton from "@/components/auth/signout-button";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <Link href="/" className="font-semibold text-lg">
            💰 Money Manager
          </Link>
          <AppNav />
          <SignOutButton />
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}
