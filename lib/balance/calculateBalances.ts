export interface BalanceUser {
  id: number;
  name: string;
}

/**
 * A directional transaction: `paidBy` paid `amountCents` on behalf of
 * `expenseFor`, so `expenseFor` owes `paidBy` that amount.
 */
export interface Transaction {
  paidBy: BalanceUser;
  expenseFor: BalanceUser;
  amountCents: number;
}

/** `from` owes `to` a positive `amountCents`. */
export interface Balance {
  from: BalanceUser;
  to: BalanceUser;
  amountCents: number;
}

interface PairBalance {
  /** The user with the lower id in the pair. */
  low: BalanceUser;
  /** The user with the higher id in the pair. */
  high: BalanceUser;
  /** Net amount `high` owes `low`. Negative means `low` owes `high`. */
  netCents: number;
}

/**
 * Nets all transactions between each pair of users into a single directional
 * balance. Opposite transactions cancel each other out and pairs that net to
 * zero are omitted.
 *
 * Results are sorted by amount (largest first), then by debtor and creditor
 * name, so the output is deterministic.
 */
export function calculateBalances(transactions: readonly Transaction[]): Balance[] {
  const pairs = new Map<string, PairBalance>();

  for (const { paidBy, expenseFor, amountCents } of transactions) {
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
      throw new RangeError(`Invalid amount in cents: ${amountCents}`);
    }
    if (paidBy.id === expenseFor.id) {
      continue; // Paying for yourself creates no debt.
    }

    const [low, high] = paidBy.id < expenseFor.id ? [paidBy, expenseFor] : [expenseFor, paidBy];
    const key = `${low.id}:${high.id}`;
    const pair = pairs.get(key) ?? { low, high, netCents: 0 };

    // The person the expense was for owes the payer.
    pair.netCents += expenseFor.id === high.id ? amountCents : -amountCents;
    pairs.set(key, pair);
  }

  const balances: Balance[] = [];
  for (const { low, high, netCents } of pairs.values()) {
    if (netCents > 0) {
      balances.push({ from: high, to: low, amountCents: netCents });
    } else if (netCents < 0) {
      balances.push({ from: low, to: high, amountCents: -netCents });
    }
  }

  return balances.sort(
    (a, b) =>
      b.amountCents - a.amountCents ||
      a.from.name.localeCompare(b.from.name) ||
      a.to.name.localeCompare(b.to.name),
  );
}
