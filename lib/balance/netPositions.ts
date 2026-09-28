import type { Balance } from "@/lib/balance/calculateBalances";

export interface NetPosition {
  /** Total others owe this user. */
  owedCents: number;
  /** Total this user owes others. */
  owesCents: number;
  /** `owedCents - owesCents`. Positive: owed overall. Negative: owes overall. */
  netCents: number;
}

const EMPTY_POSITION: NetPosition = { owedCents: 0, owesCents: 0, netCents: 0 };

/** Per-user totals derived from pairwise balances, keyed by user id. */
export function calculateNetPositions(
  balances: readonly Pick<Balance, "from" | "to" | "amountCents">[],
): Map<number, NetPosition> {
  const positions = new Map<number, NetPosition>();

  for (const { from, to, amountCents } of balances) {
    const creditor = positions.get(to.id) ?? EMPTY_POSITION;
    positions.set(to.id, {
      ...creditor,
      owedCents: creditor.owedCents + amountCents,
      netCents: creditor.netCents + amountCents,
    });

    const debtor = positions.get(from.id) ?? EMPTY_POSITION;
    positions.set(from.id, {
      ...debtor,
      owesCents: debtor.owesCents + amountCents,
      netCents: debtor.netCents - amountCents,
    });
  }

  return positions;
}

export function getNetPosition(positions: Map<number, NetPosition>, userId: number): NetPosition {
  return positions.get(userId) ?? EMPTY_POSITION;
}
