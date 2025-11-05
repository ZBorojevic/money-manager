// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import TransactionForm from "@/components/transactions/transaction-form";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in?next=%2Fdashboard");

  const [accounts, categories, recentTx, counts] = await Promise.all([
    prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, currency: true },
    }),
    prisma.category.findMany({
      where: { userId: user.id },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: { id: true, name: true, type: true },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { occurredAt: "desc" },
      take: 10,
      include: { account: true, category: true },
    }),
    (async () => {
      const [acc, tx] = await Promise.all([
        prisma.account.count({ where: { userId: user.id } }),
        prisma.transaction.count({ where: { userId: user.id } }),
      ]);
      return { acc, tx };
    })(),
  ]);

  const defaultCurrency = accounts[0]?.currency ?? "EUR";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Stat kartice */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-slate-500">Accounts</div>
          <div className="text-xl font-semibold">{counts.acc}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-slate-500">Transactions</div>
          <div className="text-xl font-semibold">{counts.tx}</div>
        </div>
      </div>

      {/* Quick add */}
      <div className="rounded-xl border p-4">
        <h2 className="font-medium mb-3">Quick Add Transaction</h2>
        <TransactionForm
          accounts={accounts}
          categories={categories}
          defaultCurrency={defaultCurrency}
          onCreated={undefined /* list iske refresha nakon dodavanja – F5 je ok za sada */}
        />
      </div>

      {/* Recent */}
      <div className="rounded-xl border p-4">
        <h2 className="font-medium mb-3">Recent Transactions</h2>
        {recentTx.length === 0 ? (
          <p className="text-sm text-slate-500">No transactions yet.</p>
        ) : (
          <ul className="divide-y">
            {recentTx.map((t) => (
              <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {t.category?.name ?? t.type}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(t.occurredAt).toLocaleDateString()} • {t.account.name}
                    {t.note ? ` • ${t.note}` : ""}
                  </div>
                </div>
                <div
                  className={`text-sm font-semibold ${
                    t.type === "EXPENSE" ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {t.type === "EXPENSE" ? "-" : "+"}
                  {t.amount.toString()} {t.currency}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
