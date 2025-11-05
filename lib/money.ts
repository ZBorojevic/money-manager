import Decimal from "decimal.js";

export function parseAmountToDecimalString(input: string) {
  const normalized = String(input).trim().replace(/\./g, "").replace(",", ".");
  const value = new Decimal(normalized);
  if (!value.isFinite()) throw new Error("Invalid amount");
  return value.toFixed(2);
}

export function formatMoney(
  amount: Decimal.Value,
  currency = "EUR",
  locale = "en-GB"
) {
  const num = new Decimal(amount).toNumber();
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(num);
}
