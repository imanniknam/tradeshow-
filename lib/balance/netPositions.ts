import type { Balance } from "@/lib/balance/calculateBalances";

/**
 * Net position per user id derived from pairwise balances, in cents.
 * Positive: the user is owed money overall. Negative: the user owes money.
 */
export function calculateNetPositions(balances: readonly Pick<Balance, "from" | "to" | "amountCents">[]) {
  const positions = new Map<number, number>();
  for (const { from, to, amountCents } of balances) {
    positions.set(to.id, (positions.get(to.id) ?? 0) + amountCents);
    positions.set(from.id, (positions.get(from.id) ?? 0) - amountCents);
  }
  return positions;
}
