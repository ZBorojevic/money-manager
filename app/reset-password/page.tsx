"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is missing."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(6, "Please retype your password."),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof ResetPasswordSchema>;

export default function ResetPasswordPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  // Keep token in sync if query changes (rare, but safe)
  if (token) setValue("token", token, { shouldValidate: false });

  const onSubmit = async (values: ResetPasswordValues) => {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: values.token, password: values.password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.message ?? "Could not set a new password.");
      return;
    }

    router.replace("/sign-in");
    router.refresh();
  };

  return (
    <main className="min-h-svh grid place-items-center p-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 border rounded-xl p-6"
      >
        <h1 className="text-xl font-semibold text-center">Set new password</h1>

        {/* Hidden token */}
        <input type="hidden" {...register("token")} />
        {errors.token && (
          <p className="text-sm text-red-600">{errors.token.message}</p>
        )}

        <div className="space-y-1">
          <label className="text-sm">New password</label>
          <input
            className="w-full border rounded-md p-2"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm">Retype password</label>
          <input
            className="w-full border rounded-md p-2"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button type="submit" className="w-full rounded-md p-2 border" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Set password"}
        </button>

        <div className="text-sm text-center">
          <Link className="underline" href="/sign-in">
            Back to sign in
          </Link>
        </div>
      </form>
    </main>
  );
}
