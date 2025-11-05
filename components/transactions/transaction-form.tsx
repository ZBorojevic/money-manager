// components/transactions/transaction-form.tsx
"use client";

import { useMemo, useState } from "react";

type Account = { id: string; name: string; currency: string | null };
type Category = { id: string; name: string; type: "INCOME" | "EXPENSE" };

export default function TransactionForm({
  accounts,
  categories,
  defaultCurrency = "EUR",
  onCreated,
}: {
  accounts: Account[];
  categories: Category[];
  defaultCurrency?: string;
  onCreated?: () => void;
}) {
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const firstCat = categories.find((c) => c.type === type)?.id ?? "";
  const [categoryId, setCategoryId] = useState(firstCat);

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  function normalizeAmount(input: string): string {
    // dozvoli "100,00" -> "100.00"; makni razmake
    let x = input.replace(/\s/g, "");
    x = x.replace(",", ".");
    return x;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const normalized = normalizeAmount(amount);
      if (!normalized || Number.isNaN(Number(normalized)) || Number(normalized) <= 0) {
        throw new Error("Amount must be a positive number.");
      }
      if (!accountId) throw new Error("Please choose an account.");
      if (!categoryId) throw new Error("Please choose a category.");

      const payload = {
        type,
        accountId,
        categoryId,
        amount: normalized, // šaljemo kao string (api će pretvoriti u Decimal)
        currency: defaultCurrency,
        date,
        note: note.trim() || null,
      };

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

      // reset + notify
      setAmount("");
      setNote("");
      const first = filteredCategories[0]?.id ?? "";
      setCategoryId(first);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-2 md:grid-cols-2">
        <select
          className="w-full rounded-lg border px-3 py-2"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.currency ?? defaultCurrency})
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={type}
            onChange={(e) => {
              const t = e.target.value as "INCOME" | "EXPENSE";
              setType(t);
              const first = categories.find((c) => c.type === t)?.id ?? "";
              setCategoryId(first);
            }}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>

          <select
            className="w-full rounded-lg border px-3 py-2"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <input
        inputMode="decimal"
        placeholder={`Amount (${defaultCurrency})`}
        className="w-full rounded-lg border px-3 py-2"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <input
        type="date"
        className="w-full rounded-lg border px-3 py-2"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <input
        className="w-full rounded-lg border px-3 py-2"
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-black text-white py-2 font-medium"
      >
        {pending ? "Saving..." : "Add transaction"}
      </button>
    </form>
  );
}
