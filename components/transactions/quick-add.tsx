"use client";

import { useState } from "react";

type Account = { id: string; name: string; currency: string | null };
type Category = { id: string; name: string; type: "INCOME" | "EXPENSE" };

type Props = {
  accounts: Account[];
  categories: Category[];
  defaultCurrency: string;
  onCreated?: () => void;
};

export default function QuickAddTransaction({
  accounts,
  categories,
  defaultCurrency,
  onCreated,
}: Props) {
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(
    categories.find((c) => c.type === type)?.id ?? ""
  );
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeCategories = categories.filter((c) => c.type === type);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const payload = {
        type,
        accountId,
        categoryId,
        amount: Number(amount),
        currency: defaultCurrency,
        date,
        note: note.trim() || null,
      };

      if (!payload.accountId || !payload.categoryId)
        throw new Error("Please select account and category.");
      if (!Number.isFinite(payload.amount) || payload.amount <= 0)
        throw new Error("Amount must be a positive number.");

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = "Failed to create transaction.";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch {}
        throw new Error(msg);
      }

      setAmount("");
      setNote("");
      const first = categories.find((c) => c.type === type);
      setCategoryId(first?.id ?? "");
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Type</label>
          <select
            className="w-full border rounded-md p-2"
            value={type}
            onChange={(e) => {
              const t = e.target.value as "INCOME" | "EXPENSE";
              setType(t);
              const first = categories.find((c) => c.type === t);
              setCategoryId(first?.id ?? "");
            }}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
        </div>

        <div>
          <label className="text-sm">Account</label>
          <select
            className="w-full border rounded-md p-2"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.currency ?? defaultCurrency})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Category</label>
          <select
            className="w-full border rounded-md p-2"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {typeCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm">Amount ({defaultCurrency})</label>
          <input
            className="w-full border rounded-md p-2"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Date</label>
          <input
            className="w-full border rounded-md p-2"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm">Note (optional)</label>
          <input
            className="w-full border rounded-md p-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={pending} className="rounded-md border px-3 py-2">
        {pending ? "Saving..." : "Add transaction"}
      </button>
    </form>
  );
}
