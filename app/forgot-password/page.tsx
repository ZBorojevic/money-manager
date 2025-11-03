"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

const ResetRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

type ResetRequestValues = z.infer<typeof ResetRequestSchema>;

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ResetRequestValues>({
    resolver: zodResolver(ResetRequestSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ResetRequestValues) => {
    await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    // No need to handle error details here to avoid leaking whether the email exists
  };

  return (
    <main className="min-h-svh grid place-items-center p-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 border rounded-xl p-6"
      >
        <h1 className="text-xl font-semibold text-center">Forgot password</h1>

        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input
            className="w-full border rounded-md p-2"
            type="email"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <button type="submit" className="w-full rounded-md p-2 border" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>

        {isSubmitSuccessful && (
          <p className="text-sm text-green-600">
            If this email exists, we’ve sent a reset link with instructions.
          </p>
        )}

        <div className="text-sm text-center">
          <Link className="underline" href="/sign-in">
            Back to sign in
          </Link>
        </div>
      </form>
    </main>
  );
}
