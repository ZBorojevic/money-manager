"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";

type Category = { id: string; name: string; type: "INCOME" | "EXPENSE" };

export default function TransactionForm({ categories }: { categories: Category[] }) {
  const { register, handleSubmit, reset } = useForm<{ categoryId: string; amount: string; occurredAt: string; note?: string; }>(
    { defaultValues: { occurredAt: new Date().toISOString().slice(0,10) } }
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(values: any) {
    setLoading(true);
    try {
      const payload = { ...values, occurredAt: new Date(values.occurredAt).toISOString() };
      await fetch("/api/transactions", { method: "POST", body: JSON.stringify(payload) });
      reset();
      window.dispatchEvent(new Event("transactions:refresh"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <select {...register("categoryId")} className="border rounded-xl px-3 py-2">
        <option value="">Select category</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name} {c.type === "EXPENSE" ? "• Expense" : "• Income"}</option>)}
      </select>
      <input {...register("amount")} inputMode="decimal" placeholder="Amount e.g. 100,00" className="border rounded-xl px-3 py-2" />
      <input type="date" {...register("occurredAt")} className="border rounded-xl px-3 py-2" />
      <div className="flex gap-2">
        <input {...register("note")} placeholder="Note (optional)" className="border flex-1 rounded-xl px-3 py-2" />
        <button disabled={loading} className="rounded-xl px-4 py-2 bg-black text-white">
          {loading ? "Adding..." : "Add"}
        </button>
      </div>
    </form>
  );
}
