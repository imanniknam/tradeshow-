import type { Balance, BalanceUser } from "@/lib/balance/calculateBalances";

/**
 * Net amount `debtorId` owes `creditorId`, read from already-netted pairwise
 * balances. Negative when the debt runs the other way, `0` when settled.
 */
export function netOwedCents(
  balances: readonly Pick<Balance, "from" | "to" | "amountCents">[],
  debtorId: number,
  creditorId: number,
): number {
  for (const { from, to, amountCents } of balances) {
    if (from.id === debtorId && to.id === creditorId) return amountCents;
    if (from.id === creditorId && to.id === debtorId) return -amountCents;
  }
  return 0;
}

/** Who owes whom between two people, or `null` when they are settled up. */
export function describeNet(
  a: BalanceUser,
  b: BalanceUser,
  aOwesBCents: number,
): Balance | null {
  if (aOwesBCents > 0) return { from: a, to: b, amountCents: aOwesBCents };
  if (aOwesBCents < 0) return { from: b, to: a, amountCents: -aOwesBCents };
  return null;
}

/**
 * The balance between payer and recipient before and after a new expense.
 * A new expense always moves the pair towards "recipient owes payer", which
 * may reduce, settle or flip an existing debt in the other direction.
 */
export function previewExpenseEffect(
  balances: readonly Pick<Balance, "from" | "to" | "amountCents">[],
  payer: BalanceUser,
  recipient: BalanceUser,
  amountCents: number,
) {
  const before = netOwedCents(balances, recipient.id, payer.id);
  const after = before + amountCents;
  return {
    before: describeNet(recipient, payer, before),
    after: describeNet(recipient, payer, after),
  };
}
