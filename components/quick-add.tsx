"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

type Account = { id: string; name: string; currency: string };
type Category = { id: string; name: string; type: "INCOME" | "EXPENSE" };

type FormValues = {
  type: "INCOME" | "EXPENSE";
  accountId: string;
  categoryId?: string;
  amount: string;
  occurredAt: string; // yyyy-mm-dd
  note?: string;
};

export default function QuickAdd() {
  const { register, handleSubmit, watch, reset } = useForm<FormValues>({
    defaultValues: {
      type: "EXPENSE",
      occurredAt: new Date().toISOString().slice(0, 10),
    },
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const type = watch("type");
  const filtered = useMemo(() => categories.filter(c => c.type === type), [categories, type]);

  useEffect(() => {
    (async () => {
      const acc = (await fetch("/api/accounts").then(r => r.json())) as Account[];
      const cat = (await fetch("/api/categories").then(r => r.json())) as Category[];
      setAccounts(acc);
      setCategories(cat);
    })();
  }, []);

  async function onSubmit(values: FormValues) {
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, occurredAt: new Date(values.occurredAt).toISOString() }),
      });
      const data: { error?: string } = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed");
      reset({ type, occurredAt: new Date().toISOString().slice(0, 10) });
      // jednostavno: refresh
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-5">
      <select {...register("type")} className="border rounded-xl px-3 py-2">
        <option value="EXPENSE">Expense</option>
        <option value="INCOME">Income</option>
      </select>

      <select {...register("accountId", { required: true })} className="border rounded-xl px-3 py-2">
        <option value="">Select account</option>
        {accounts.map(a => (
          <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
        ))}
      </select>

      <select {...register("categoryId")} className="border rounded-xl px-3 py-2">
        <option value="">No category</option>
        {filtered.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <input {...register("amount", { required: true })} inputMode="decimal" placeholder="Amount e.g. 100,00" className="border rounded-xl px-3 py-2" />
      <div className="flex items-stretch gap-2">
        <input type="date" {...register("occurredAt")} className="border rounded-xl px-3 py-2" />
        <button disabled={saving} className="rounded-xl px-4 py-2 bg-black text-white">
          {saving ? "Adding…" : "Add"}
        </button>
      </div>
      <input {...register("note")} placeholder="Note (optional)" className="md:col-span-5 border rounded-xl px-3 py-2" />
      {error && <p className="text-sm text-red-600 md:col-span-5">{error}</p>}
    </form>
  );
}
