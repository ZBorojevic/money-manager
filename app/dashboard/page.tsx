import AppShell from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { ensureUserBootstrap } from "@/lib/bootstrap";
import { formatMoney } from "@/lib/money";
import Decimal from "decimal.js";
import { TxnType } from "@/lib/generated/prisma";

// helperi za tekući mjesec (UTC)
function startMonth() { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); }
function endMonth() { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)); }

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  // === KLJUČNO: kreiraj Main + default kategorije svakim ulazom ===
  await ensureUserBootstrap(user.id);

  // podaci za overview i liste
  const [incAgg, expAgg, accounts, incomeCats, expenseCats, txs] = await Promise.all([
    prisma.transaction.aggregate({ where: { userId: user.id, type: TxnType.INCOME, occurredAt: { gte: startMonth(), lt: endMonth() } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { userId: user.id, type: TxnType.EXPENSE, occurredAt: { gte: startMonth(), lt: endMonth() } }, _sum: { amount: true } }),
    prisma.account.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { userId: user.id, type: "INCOME" }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { userId: user.id, type: "EXPENSE" }, orderBy: { name: "asc" } }),
    prisma.transaction.findMany({ where: { userId: user.id }, include: { account: true, category: true }, orderBy: { occurredAt: "desc" }, take: 20 }),
  ]);

  const inc = new Decimal(incAgg._sum.amount ?? 0);
  const exp = new Decimal(expAgg._sum.amount ?? 0);
  const bal = inc.minus(exp);

  // client form komponenta (lazy import)
  const TransactionForm = (await import("@/components/forms/transaction-form")).default;
  const AccountForm = (await import("@/components/forms/account-form")).default;
  const CategoryForm = (await import("@/components/forms/category-form")).default;

  return (
    <AppShell>
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        {/* OVERVIEW */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card"><div className="text-sm text-neutral-600">Income</div><div className="text-2xl font-semibold">{formatMoney(inc)}</div></div>
          <div className="card"><div className="text-sm text-neutral-600">Expenses</div><div className="text-2xl font-semibold">{formatMoney(exp)}</div></div>
          <div className="card"><div className="text-sm text-neutral-600">Balance</div><div className="text-2xl font-semibold">{formatMoney(bal)}</div></div>
          <div className="card"><div className="text-sm text-neutral-600">Pace score</div><div className="text-2xl font-semibold">—</div><div className="text-xs text-neutral-500">Placeholder</div></div>
        </div>

        {/* QUICK ADD */}
        <div className="card">
          <div className="mb-3 font-medium">Quick add transaction</div>
          <TransactionForm />
        </div>

        {/* ACCOUNTS + CATEGORIES */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <div className="mb-3 font-medium">Accounts</div>
            <AccountForm />
            <ul className="divide-y mt-4">
              {accounts.map(a => (
                <li key={a.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-sm text-neutral-600">Currency: {a.currency}</div>
                  </div>
                  <div className="text-sm text-neutral-600">Balance: {a.balance.toString()}</div>
                </li>
              ))}
              {!accounts.length && <li className="py-6 text-sm text-neutral-600">No accounts.</li>}
            </ul>
          </div>

          <div className="card">
            <div className="mb-3 font-medium">Categories</div>
            <CategoryForm />
            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <div>
                <div className="mb-2 font-medium">Income</div>
                <ul className="text-sm text-neutral-700 list-disc pl-5">
                  {incomeCats.map(c => <li key={c.id}>{c.name}</li>)}
                  {!incomeCats.length && <li className="text-neutral-500">None</li>}
                </ul>
              </div>
              <div>
                <div className="mb-2 font-medium">Expenses</div>
                <ul className="text-sm text-neutral-700 list-disc pl-5">
                  {expenseCats.map(c => <li key={c.id}>{c.name}</li>)}
                  {!expenseCats.length && <li className="text-neutral-500">None</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* TRANSACTIONS */}
        <div className="card">
          <div className="mb-3 font-medium">Recent transactions</div>
          <div className="divide-y">
            {txs.length === 0 && <div className="py-6 text-sm text-neutral-600">No transactions yet.</div>}
            {txs.map(t => (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.category?.name ?? "—"} · {t.account.name}</div>
                  {t.note && <div className="text-sm text-neutral-600">{t.note}</div>}
                </div>
                <div className={t.type === "EXPENSE" ? "text-red-600" : "text-green-700"}>
                  {t.type === "EXPENSE" ? "-" : "+"}{formatMoney(t.amount, t.currency)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
