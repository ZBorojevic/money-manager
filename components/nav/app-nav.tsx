// components/nav/app-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Overview" },
  { href: "/analyze", label: "Analyze" },
  { href: "/invest", label: "Invest" },
  { href: "/plan", label: "Plan" },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-3 text-sm">
      {items.map((it) => {
        const active = pathname === it.href || pathname?.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={
              "rounded-md px-3 py-1.5 transition " +
              (active
                ? "bg-black text-white"
                : "text-slate-600 hover:bg-slate-100")
            }
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
