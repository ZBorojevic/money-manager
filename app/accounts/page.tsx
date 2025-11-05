import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { ensureUserBootstrap } from "@/lib/bootstrap";
import AccountForm from "@/components/forms/account-form";

export default async function AccountsPage() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  await ensureUserBootstrap(user.id);

  const accounts = await prisma.account.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Accounts</h1>
      <div className="card"><div className="mb-3 font-medium">Add account</div><AccountForm /></div>
      <div className="card">
        <ul className="divide-y">
          {accounts.map(a => (
            <li key={a.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{a.name}</div>
                <div className="text-sm text-neutral-600">Currency: {a.currency}</div>
              </div>
              <div className="text-sm text-neutral-600">Balance: {a.balance.toString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
