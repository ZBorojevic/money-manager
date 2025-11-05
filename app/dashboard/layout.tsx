// app/dashboard/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Sidebar from "@/components/nav/sidebar";
import { getSessionUser } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in?next=%2Fdashboard");

  return (
    <div className="min-h-svh md:grid md:grid-cols-[auto,1fr]">
      <Sidebar />
      <main className="p-4 md:p-6">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
