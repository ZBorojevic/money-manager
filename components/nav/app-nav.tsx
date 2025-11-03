"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/invest", label: "Invest" },
  { href: "/plan", label: "Plan" },
  { href: "/analyze", label: "Analyze" },
];

export default function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-3 text-sm">
      {items.map((i) => {
        const active = pathname.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`rounded-lg px-3 py-1.5 border ${active ? "bg-black text-white" : ""}`}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
