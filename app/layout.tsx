import "./globals.css";
import type { Metadata } from "next";
import AppShell from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Money Manager",
  description: "Track income & expenses with ease",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
