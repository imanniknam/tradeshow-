import { describe, expect, it } from "vitest";

import { calculateNetPositions } from "@/lib/balance/netPositions";

const alice = { id: 1, name: "Alice" };
const bob = { id: 2, name: "Bob" };
const charlie = { id: 3, name: "Charlie" };

describe("calculateNetPositions", () => {
  it("credits creditors and debits debtors", () => {
    const positions = calculateNetPositions([
      { from: bob, to: alice, amountCents: 12000 },
      { from: charlie, to: alice, amountCents: 5000 },
      { from: charlie, to: bob, amountCents: 2000 },
    ]);

    expect(positions.get(alice.id)).toBe(17000);
    expect(positions.get(bob.id)).toBe(-10000);
    expect(positions.get(charlie.id)).toBe(-7000);
  });

  it("sums to zero across all users", () => {
    const positions = calculateNetPositions([
      { from: bob, to: alice, amountCents: 999 },
      { from: alice, to: charlie, amountCents: 1 },
    ]);
    const total = [...positions.values()].reduce((sum, cents) => sum + cents, 0);
    expect(total).toBe(0);
  });

  it("returns an empty map when there are no balances", () => {
    expect(calculateNetPositions([]).size).toBe(0);
  });
});
