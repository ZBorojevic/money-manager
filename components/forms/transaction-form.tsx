"use client";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
type Category = { id: string; name: string; type: "INCOME" | "EXPENSE" };
type Account  = { id: string; name: string; currency: string };
type FormValues = {
  accountId: string;
  categoryId?: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  occurredAt: string;
  note?: string;
};

export default function TransactionForm() {
  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: { type: "EXPENSE", occurredAt: new Date().toISOString().slice(0, 10) },
  });

  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const type = watch("type");

  useEffect(() => {
    (async () => {
      const [accRes, catRes] = await Promise.all([
        fetch("/api/accounts").then(r => r.json()).catch(() => [] as Account[]),
        fetch("/api/categories").then(r => r.json()).catch(() => [] as Category[]),
      ]);
      setAccounts(accRes || []);
      setCategories(catRes || []);
    })();
  }, []);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const payload = { ...values, occurredAt: new Date(values.occurredAt).toISOString() };
      await fetch("/api/transactions", { method: "POST", body: JSON.stringify(payload) });
      reset({ type, occurredAt: new Date().toISOString().slice(0,10) });
      window.dispatchEvent(new Event("transactions:refresh"));
    } finally {
      setLoading(false);
    }
  }

  const filtered = categories.filter(c => c.type === type);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <select {...register("type")} className="border rounded-xl px-3 py-2">
        <option value="EXPENSE">Expense</option><option value="INCOME">Income</option>
      </select>
      <select {...register("accountId", { required: true })} className="border rounded-xl px-3 py-2">
        <option value="">Select account</option>
        {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
      </select>
      <select {...register("categoryId")} className="border rounded-xl px-3 py-2">
        <option value="">No category</option>
        {filtered.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input {...register("amount", { required: true })} inputMode="decimal" placeholder="Amount e.g. 100,00" className="border rounded-xl px-3 py-2" />
      <div className="flex gap-2">
        <input type="date" {...register("occurredAt")} className="border rounded-xl px-3 py-2" />
        <button disabled={loading} className="rounded-xl px-4 py-2 bg-black text-white">{loading ? "Adding..." : "Add"}</button>
      </div>
      <input {...register("note")} placeholder="Note (optional)" className="sm:col-span-2 lg:col-span-5 border rounded-xl px-3 py-2" />
    </form>
  );
}
