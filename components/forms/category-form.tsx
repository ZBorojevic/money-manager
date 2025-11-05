"use client";
import { useForm } from "react-hook-form";
import { useState } from "react";

type FormValues = { name: string; type: "INCOME" | "EXPENSE"; icon?: string; color?: string };

export default function CategoryForm() {
  const { register, handleSubmit, reset } = useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await fetch("/api/categories", { method: "POST", body: JSON.stringify(values) });
      reset();
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap gap-2">
      <input {...register("name", { required: true })} placeholder="Category name" className="border rounded-xl px-3 py-2" />
      <select {...register("type")} className="border rounded-xl px-3 py-2">
        <option value="EXPENSE">Expense</option>
        <option value="INCOME">Income</option>
      </select>
      <input {...register("icon")} placeholder="Icon (optional)" className="border rounded-xl px-3 py-2" />
      <input {...register("color")} placeholder="Color (optional)" className="border rounded-xl px-3 py-2" />
      <button className="rounded-xl px-4 py-2 bg-black text-white" disabled={loading}>
        {loading ? "Adding..." : "Add"}
      </button>
    </form>
  );
}
