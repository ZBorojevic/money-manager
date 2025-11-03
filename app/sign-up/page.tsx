"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ---- Zod schema ----
const SignUpSchema = z
  .object({
    username: z.string().min(2, "Username is required."),
    email: z.string().email("Invalid email address."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(6, "Please retype your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SignUpValues = z.infer<typeof SignUpSchema>;

export default function SignUpPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(SignUpSchema),
  });

  const onSubmit = async (values: SignUpValues) => {
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message ?? "Sign up failed.");
      }

      router.replace("/sign-in");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error during sign up.");
    }
  };

  return (
    <main className="min-h-svh flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm mx-auto space-y-4 border rounded-xl p-6"
      >
        <h1 className="text-xl font-semibold text-center">Create Account</h1>

        <div className="space-y-1">
          <label className="text-sm">Username</label>
          <input className="w-full border rounded-md p-2" {...register("username")} />
          {errors.username && (
            <p className="text-sm text-red-600">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input
            className="w-full border rounded-md p-2"
            {...register("email")}
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input
            type="password"
            className="w-full border rounded-md p-2"
            {...register("password")}
            autoComplete="new-password"
          />
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm">Retype Password</label>
          <input
            type="password"
            className="w-full border rounded-md p-2"
            {...register("confirmPassword")}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full rounded-md p-2 border"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Account"}
        </button>

        <div className="text-sm text-center">
          Already have an account?{" "}
          <Link href="/sign-in" className="underline">
            Sign in
          </Link>
        </div>
      </form>
    </main>
  );
}
