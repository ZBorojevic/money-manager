"use client";

import QuickAddTransaction from "@/components/transactions/quick-add";

type Account = { id: string; name: string; currency: string | null };
type Category = { id: string; name: string; type: "INCOME" | "EXPENSE" };

export type QuickAddClientProps = {
  accounts: Account[];
  categories: Category[];
  defaultCurrency: string;
  onCreated?: () => void;
};

export default function QuickAddClient(props: QuickAddClientProps) {
  return <QuickAddTransaction {...props} />;
}
