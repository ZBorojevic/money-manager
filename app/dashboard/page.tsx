import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import Decimal from "decimal.js";
import { TxnType } from "@/lib/generated/prisma";

function startMonth() { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); }
function endMonth() { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)); }

export default async function DashboardPage() {
  const user = await getSessionUser();
  const [income, expenses, txs] = await Promise.all([
    prisma.transaction.aggregate({ where: { userId: user!.id, type: TxnType.INCOME, occurredAt: { gte: startMonth(), lt: endMonth() } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { userId: user!.id, type: TxnType.EXPENSE, occurredAt: { gte: startMonth(), lt: endMonth() } }, _sum: { amount: true } }),
    prisma.transaction.findMany({ where: { userId: user!.id }, include: { account: true, category: true }, orderBy: { occurredAt: "desc" }, take: 10 }),
  ]);
  const inc = new Decimal(income._sum.amount ?? 0);
  const exp = new Decimal(expenses._sum.amount ?? 0);
  const bal = inc.minus(exp);

  const TransactionForm = (await import("@/components/forms/transaction-form")).default;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card"><div className="text-sm text-neutral-600">Income</div><div className="text-2xl font-semibold">{formatMoney(inc)}</div></div>
        <div className="card"><div className="text-sm text-neutral-600">Expenses</div><div className="text-2xl font-semibold">{formatMoney(exp)}</div></div>
        <div className="card"><div className="text-sm text-neutral-600">Balance</div><div className="text-2xl font-semibold">{formatMoney(bal)}</div></div>
        <div className="card"><div className="text-sm text-neutral-600">Pace score</div><div className="text-2xl font-semibold">—</div></div>
      </div>

      <div className="card"><div className="mb-3 font-medium">Quick add transaction</div><TransactionForm /></div>

      <div className="card">
        <div className="mb-3 font-medium">Recent transactions</div>
        <div className="divide-y">
          {txs.length === 0 && <div className="py-6 text-sm text-neutral-600">No transactions yet.</div>}
          {txs.map(t => (
            <div key={t.id} className="py-3 flex justify-between items-center">
              <div>
                <div className="font-medium">{t.category?.name ?? "—"} · {t.account.name}</div>
                {t.note && <div className="text-sm text-neutral-600">{t.note}</div>}
              </div>
              <div className={t.type === "EXPENSE" ? "text-red-600" : "text-green-600"}>
                {t.type === "EXPENSE" ? "-" : "+"}{formatMoney(t.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
