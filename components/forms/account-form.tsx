"use client";
import { useForm } from "react-hook-form";
import { useState } from "react";

type FormValues = { name: string; currency: string };

export default function AccountForm() {
  const { register, handleSubmit, reset } = useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(values: FormValues) {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data as { error?: string } | null)?.error ?? `Request failed (${res.status})`);
      reset();
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap gap-2">
        <input {...register("name", { required: true })} placeholder="Account name (e.g., Main)" className="border rounded-xl px-3 py-2 flex-1" />
        <select {...register("currency", { required: true })} className="border rounded-xl px-3 py-2">
          <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
        </select>
        <button disabled={loading} className="rounded-xl px-4 py-2 bg-black text-white">{loading ? "Adding..." : "Add"}</button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </>
  );
}
