"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SignInSchema } from "@/lib/validation";

type SignInValues = z.infer<typeof SignInSchema>;

export default function SignInPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInValues) {
    const res = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError("root", { type: "server", message: data?.message ?? "Sign in failed." });
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <main className="min-h-svh flex items-center justify-center p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm mx-auto space-y-4 border rounded-xl p-6">
        <h1 className="text-xl font-semibold text-center">Sign in</h1>

        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input className="w-full border rounded-md p-2" autoComplete="username" {...register("email")} />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input
            className="w-full border rounded-md p-2"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
        </div>

        {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}

        <button type="submit" className="w-full rounded-md p-2 border" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

        <div className="flex justify-between text-sm">
          <Link href="/sign-up" className="underline">
            Create account
          </Link>
          <Link href="/forgot-password" className="underline">
            Forgot password
          </Link>
        </div>
      </form>
    </main>
  );
}
