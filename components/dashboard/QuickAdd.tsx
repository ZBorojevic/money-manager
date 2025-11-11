"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Account = { id: string; name: string; currency: string; balance: number };
type Category = { id: string; name: string; type: "INCOME" | "EXPENSE" };

type Props = {
  accounts: Account[];
  categories: Category[];
};

export default function QuickAdd({ accounts, categories }: Props) {
  const router = useRouter();

  // Transaction state
  const [tType, setTType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>("");

  // Account state
  const [accName, setAccName] = useState<string>("");
  const [accCurr, setAccCurr] = useState<string>("EUR");

  // Category state
  const [catName, setCatName] = useState<string>("");
  const [catType, setCatType] = useState<"INCOME" | "EXPENSE">("EXPENSE");

  // helpers
  async function postJSON(url: string, payload: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `Request failed: ${res.status}`);
    }
    return res.json().catch(() => ({}));
  }

  // Actions
  async function addTransaction() {
    if (!accountId || !amount || !dateStr) return;
    await postJSON("/api/transactions", {
      type: tType,
      accountId,
      categoryId: categoryId || null,
      amount,            // npr. "100,00" → backend normalizira
      occurredAt: dateStr,
      note: note || null,
    });
    // reset samo amount/note
    setAmount("");
    setNote("");
    router.refresh();
  }

  async function addAccount() {
    if (!accName.trim()) return;
    await postJSON("/api/accounts", { name: accName.trim(), currency: accCurr });
    setAccName("");
    router.refresh();
  }

  async function addCategory() {
    if (!catName.trim()) return;
    await postJSON("/api/categories", { name: catName.trim(), type: catType });
    setCatName("");
    router.refresh();
  }

  // UI (minimalist, mobile-first)
  return (
    <div className="space-y-8">
      {/* TRANSACTION */}
      <div>
        <div className="text-xs text-neutral-500 mb-2">Transaction</div>
        <div className="grid gap-3">
          <select
            className="h-10 rounded-xl border px-3"
            value={tType}
            onChange={(e) => setTType(e.target.value as "INCOME" | "EXPENSE")}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>

          <select
            className="h-10 rounded-xl border px-3"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <select
            className="h-10 rounded-xl border px-3"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">No category</option>
            {categories
              .filter((c) => c.type === tType)
              .map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </select>

          <input
            className="h-10 rounded-xl border px-3"
            inputMode="decimal"
            placeholder="Amount e.g. 100,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            className="h-10 rounded-xl border px-3"
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
          />
          <input
            className="h-10 rounded-xl border px-3"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <button
            onClick={addTransaction}
            className="justify-self-start rounded-xl bg-neutral-900 text-white h-10 px-5 shadow-sm"
          >
            Add transaction
          </button>
        </div>
      </div>

      {/* ACCOUNT */}
      <div className="pt-4 border-t">
        <div className="text-xs text-neutral-500 mb-2">Account</div>
        <div className="grid gap-3 sm:grid-cols-[1fr,160px]">
          <input
            className="h-10 rounded-xl border px-3"
            placeholder='Name e.g. "Main"'
            value={accName}
            onChange={(e) => setAccName(e.target.value)}
          />
          <select
            className="h-10 rounded-xl border px-3"
            value={accCurr}
            onChange={(e) => setAccCurr(e.target.value)}
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="HRK">HRK</option>
          </select>
          <button
            onClick={addAccount}
            className="justify-self-start rounded-xl bg-neutral-900 text-white h-10 px-5 shadow-sm sm:col-span-2"
          >
            Add account
          </button>
        </div>
      </div>

      {/* CATEGORY */}
      <div className="pt-4 border-t">
        <div className="text-xs text-neutral-500 mb-2">Category</div>
        <div className="grid gap-3 sm:grid-cols-[1fr,160px]">
          <input
            className="h-10 rounded-xl border px-3"
            placeholder='Name e.g. "Food"'
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
          />
          <select
            className="h-10 rounded-xl border px-3"
            value={catType}
            onChange={(e) => setCatType(e.target.value as "INCOME" | "EXPENSE")}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
          <button
            onClick={addCategory}
            className="justify-self-start rounded-xl bg-neutral-900 text-white h-10 px-5 shadow-sm sm:col-span-2"
          >
            Add category
          </button>
        </div>
      </div>
    </div>
  );
}
