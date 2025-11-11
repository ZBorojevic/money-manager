// lib/parse.ts
export function parseMoney(input: string | number): number {
  if (typeof input === "number") return input;
  // "100,00" -> "100.00", ukloni razmake
  const normalized = input.replace(/\s/g, "").replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) throw new Error("Invalid amount");
  return n;
}

export function parseISODate(input: string | Date): Date {
  if (input instanceof Date) return input;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
  return d;
}

export function isObject<T extends object>(x: unknown): x is T {
  return typeof x === "object" && x !== null;
}
