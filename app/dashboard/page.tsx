import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import Decimal from "decimal.js";
import { TxnType } from "@/lib/generated/prisma";

function startOfUTCMonth(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function endOfUTCMonth(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

async function getData(userId: string) {
  const gte = startOfUTCMonth();
  const lt  = endOfUTCMonth();

  const [txs, incomeAgg, expenseAgg, kpi] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, occurredAt: { gte, lt } },
      include: { category: true, account: true },
      orderBy: { occurredAt: "desc" },
      take: 20,
    }),
    prisma.transaction.aggregate({
      where: { userId, type: TxnType.INCOME, occurredAt: { gte, lt } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: TxnType.EXPENSE, occurredAt: { gte, lt } },
      _sum: { amount: true },
    }),
    prisma.kpiSnapshot.findUnique({
      where: { userId_year_month: { userId, year: new Date().getUTCFullYear(), month: new Date().getUTCMonth()+1 } }
    }),
  ]);

  const inc = new Decimal(incomeAgg._sum.amount ?? 0);
  const exp = new Decimal(expenseAgg._sum.amount ?? 0);
  const bal = inc.minus(exp);

  return { txs, inc, exp, bal, kpi };
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const { txs, inc, exp, bal, kpi } = await getData(user.id);
  const TransactionForm = (await import("@/components/forms/transaction-form")).default;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card"><div className="text-sm text-neutral-600">Income (month)</div><div className="text-2xl font-semibold">{formatMoney(inc)}</div></div>
        <div className="card"><div className="text-sm text-neutral-600">Expenses (month)</div><div className="text-2xl font-semibold">{formatMoney(exp)}</div></div>
        <div className="card"><div className="text-sm text-neutral-600">Balance (month)</div><div className="text-2xl font-semibold">{formatMoney(bal)}</div></div>
        <div className="card">
          <div className="text-sm text-neutral-600">Pace score</div>
          <div className="text-2xl font-semibold">{kpi?.paceScore ?? "—"}</div>
          <div className="text-xs text-neutral-500">Placeholder (via KpiSnapshot)</div>
        </div>
      </div>

      <div className="card">
        <div className="mb-3 font-medium">Quick add transaction</div>
        <TransactionForm />
      </div>

      <div className="card">
        <div className="mb-3 font-medium">Recent (this month)</div>
        <div className="divide-y">
          {txs.map(t => (
            <div key={t.id} className="py-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium">
                  {t.category?.name ?? "—"} <span className="text-neutral-500">· {t.account.name}</span>
                </span>
                {t.note && <span className="text-sm text-neutral-600">{t.note}</span>}
              </div>
              <div className={t.type === "EXPENSE" ? "text-red-600" : "text-green-700"}>
                {t.type === "EXPENSE" ? "-" : "+"}{formatMoney(t.amount, t.currency)}
              </div>
            </div>
          ))}
          {!txs.length && <div className="py-6 text-sm text-neutral-600">No transactions yet.</div>}
        </div>
      </div>
    </div>
  );
}
