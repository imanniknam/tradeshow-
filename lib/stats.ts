import type { ExpenseDto } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function sumCents(expenses: readonly ExpenseDto[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
}

/** Number of expenses created within the last `days` days. */
export function countRecent(expenses: readonly ExpenseDto[], days: number, now = Date.now()): number {
  const since = now - days * DAY_MS;
  return expenses.filter((expense) => Date.parse(expense.createdAt) >= since).length;
}
