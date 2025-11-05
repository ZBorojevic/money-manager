// components/nav/sidebar.tsx
import Link from "next/link";
import SignOutButton from "@/components/auth/signout-button";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analyze", label: "Analyze" },
  { href: "/plan", label: "Plan" },
  { href: "/invest", label: "Invest" },
];

export default function Sidebar() {
  return (
    <aside className="border-b md:border-b-0 md:border-r bg-white">
      <div className="md:sticky md:top-0 md:h-[100svh] flex md:flex-col">
        {/* Left/top rail */}
        <div className="w-full md:w-56">
          <div className="px-4 py-3 border-b md:border-b-0 md:border-b-transparent md:pt-6">
            <Link href="/" className="inline-flex items-center gap-2 font-semibold">
              <span>💸</span> <span>Money Manager</span>
            </Link>
          </div>

          <nav className="px-2 md:px-3 py-2 md:py-4 grid grid-cols-4 gap-1 md:block">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100"
              >
                {it.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block mt-auto px-3 pb-4">
            <SignOutButton />
          </div>
        </div>
      </div>
    </aside>
  );
}
