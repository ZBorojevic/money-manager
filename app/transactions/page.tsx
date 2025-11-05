import AppShell from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { ensureUserBootstrap } from "@/lib/bootstrap";
import { formatMoney } from "@/lib/money";

export default async function TransactionsPage() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  await ensureUserBootstrap(user.id);

  const txs = await prisma.transaction.findMany({
    where: { userId: user.id },
    include: { category: true, account: true },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });

  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <div className="card">
          <div className="grid text-sm font-medium text-neutral-600 grid-cols-[1fr_auto_auto_auto] gap-2 px-2">
            <div>Category / Note</div><div>Account</div><div>Date</div><div className="text-right">Amount</div>
          </div>
          <div className="divide-y">
            {txs.map(t => (
              <div key={t.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-2 py-3">
                <div>
                  <div className="font-medium">{t.category?.name ?? "—"}</div>
                  {t.note && <div className="text-sm text-neutral-600">{t.note}</div>}
                </div>
                <div className="text-sm">{t.account.name}</div>
                <div className="text-sm">{new Date(t.occurredAt).toLocaleDateString()}</div>
                <div className={"text-right " + (t.type === "EXPENSE" ? "text-red-600" : "text-green-700")}>
                  {t.type === "EXPENSE" ? "-" : "+"}{formatMoney(t.amount, t.currency)}
                </div>
              </div>
            ))}
            {!txs.length && <div className="py-6 text-sm text-neutral-600">No transactions.</div>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
