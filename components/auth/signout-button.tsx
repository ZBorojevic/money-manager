"use client";

export default function SignOutButton() {
  async function onClick() {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <button
      onClick={onClick}
      className="text-sm font-medium text-slate-600 hover:text-black transition"
    >
      Sign out
    </button>
  );
}
