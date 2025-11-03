// components/auth/signout-button.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      router.replace("/sign-in");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="text-sm px-3 py-1 rounded-md border"
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
