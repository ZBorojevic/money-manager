"use client";

import { useState, useMemo, useEffect } from "react";

type Account = { id: string; name: string; currency: string | null };
type Category = { id: string; name: string; type: "INCOME" | "EXPENSE" };

export default function AddTransactionClient({
  accounts,
  categories,
  defaultCurrency,
  onCreated,
}: {
  accounts: Account[];
  categories: Category[];
  defaultCurrency: string;
  onCreated?: () => void;
}) {
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  // postavi init kategoriju nakon filt
  useEffect(() => {
    setCategoryId((prev) => {
      if (filtered.some((c) => c.id === prev)) return prev;
      return filtered[0]?.id ?? "";
    });
  }, [filtered]);

  async function onSubmit(e: React.FormEvent) {
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

      if (!payload.accountId || !payload.categoryId) throw new Error("Pick account and category.");
      if (!Number.isFinite(payload.amount) || payload.amount <= 0) throw new Error("Amount > 0.");

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Failed to create transaction.";
        try {
          const j = await res.json();
          if (j?.message) msg = j.message;
        } catch {}
        throw new Error(msg);
      }

      setAmount("");
      setNote("");
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
            onChange={(e) => setType(e.target.value as "INCOME" | "EXPENSE")}
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
            {filtered.map((c) => (
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
