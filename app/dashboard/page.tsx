import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { ensureUserDefaults } from "@/lib/defaults";
import QuickAdd from "@/components/dashboard/QuickAdd";

function formatEUR(n: number) {
  return n.toLocaleString("hr-HR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <main className="min-h-svh grid place-items-center p-6">
        <div className="text-center">
          <div className="mb-6 grid place-items-center">
            <div className="size-14 rounded-2xl bg-neutral-900 text-white grid place-items-center text-xl">€</div>
          </div>
          <h1 className="text-2xl font-semibold mb-2">Money Manager</h1>
          <p className="text-sm text-neutral-600 mb-6">Track your income and expenses with ease.</p>
          <a
            href="/sign-in"
            className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-neutral-900 text-white shadow-sm"
          >
            Start app
          </a>
          <p className="text-xs text-neutral-400 mt-6">version 0.1.0</p>
        </div>
      </main>
    );
  }

  // bootstrap: Main account + default kategorije
  await ensureUserDefaults(user.id);

  // month window
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const [incomeAgg, expenseAgg, accounts, categories, recent] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId: user.id, type: "INCOME", occurredAt: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: user.id, type: "EXPENSE", occurredAt: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, currency: true, balance: true },
    }),
    prisma.category.findMany({
      where: { userId: user.id },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: { id: true, name: true, type: true },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { occurredAt: "desc" },
      take: 12,
      select: {
        id: true, type: true, amount: true, currency: true, occurredAt: true, note: true,
        account: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
  ]);

  const income = Number(incomeAgg._sum.amount ?? 0);
  const expenses = Number(expenseAgg._sum.amount ?? 0);
  const balance = income - expenses;

  return (
    <main className="max-w-5xl mx-auto px-5 py-8 md:py-10">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">Dashboard</h1>

      {/* KPI */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-xs text-neutral-500">Income (month)</div>
          <div className="text-2xl font-semibold">{formatEUR(income)}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-xs text-neutral-500">Expenses (month)</div>
          <div className="text-2xl font-semibold">{formatEUR(expenses)}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-xs text-neutral-500">Balance (month)</div>
          <div className="text-2xl font-semibold">{formatEUR(balance)}</div>
        </div>
      </section>

      {/* Quick add + lists */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-sm font-medium mb-4">Quick add</h2>
          <QuickAdd
            accounts={accounts}
            categories={categories}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-5">
            <h2 className="text-sm font-medium mb-4">Accounts</h2>
            {accounts.length === 0 ? (
              <div className="text-sm text-neutral-500">No accounts.</div>
            ) : (
              <ul className="divide-y">
                {accounts.map((a) => (
                  <li key={a.id} className="py-2 flex justify-between">
                    <span className="font-medium">{a.name}</span>
                    <span className="text-neutral-600">{formatEUR(Number(a.balance))}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <h2 className="text-sm font-medium mb-4">Recent (this month)</h2>
            {recent.length === 0 ? (
              <div className="text-sm text-neutral-500">No transactions yet.</div>
            ) : (
              <ul className="divide-y">
                {recent.map((t) => (
                  <li key={t.id} className="py-2 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-sm">
                        {t.category?.name ?? (t.type === "INCOME" ? "Income" : "Expense")}
                      </div>
                      <div className="text-xs text-neutral-500 truncate">
                        {new Date(t.occurredAt).toLocaleDateString("hr-HR")} · {t.account.name}
                        {t.note ? ` · ${t.note}` : ""}
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${t.type === "INCOME" ? "text-emerald-600" : "text-red-600"}`}>
                      {t.type === "INCOME" ? "+" : "-"}
                      {formatEUR(Number(t.amount))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
