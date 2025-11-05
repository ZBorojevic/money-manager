import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { ensureUserBootstrap } from "@/lib/bootstrap";
import CategoryForm from "@/components/forms/category-form";

export default async function CategoriesPage() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  await ensureUserBootstrap(user.id);

  const [income, expense] = await Promise.all([
    prisma.category.findMany({ where: { userId: user.id, type: "INCOME" }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { userId: user.id, type: "EXPENSE" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Categories</h1>
      <div className="card"><div className="mb-3 font-medium">Add category</div><CategoryForm /></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card"><div className="mb-2 font-medium">Income</div><ul className="text-sm text-neutral-700 list-disc pl-5">{income.map(c => <li key={c.id}>{c.name}</li>)}</ul></div>
        <div className="card"><div className="mb-2 font-medium">Expenses</div><ul className="text-sm text-neutral-700 list-disc pl-5">{expense.map(c => <li key={c.id}>{c.name}</li>)}</ul></div>
      </div>
    </div>
  );
}
