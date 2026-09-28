import { describe, expect, it } from "vitest";

import { calculateNetPositions, getNetPosition } from "@/lib/balance/netPositions";

const alice = { id: 1, name: "Alice" };
const bob = { id: 2, name: "Bob" };
const charlie = { id: 3, name: "Charlie" };

describe("calculateNetPositions", () => {
  it("tracks what each user is owed, owes and their net position", () => {
    const positions = calculateNetPositions([
      { from: bob, to: alice, amountCents: 12000 },
      { from: charlie, to: alice, amountCents: 5000 },
      { from: charlie, to: bob, amountCents: 2000 },
    ]);

    expect(getNetPosition(positions, alice.id)).toEqual({ owedCents: 17000, owesCents: 0, netCents: 17000 });
    expect(getNetPosition(positions, bob.id)).toEqual({ owedCents: 2000, owesCents: 12000, netCents: -10000 });
    expect(getNetPosition(positions, charlie.id)).toEqual({ owedCents: 0, owesCents: 7000, netCents: -7000 });
  });

  it("sums net positions to zero across all users", () => {
    const positions = calculateNetPositions([
      { from: bob, to: alice, amountCents: 999 },
      { from: alice, to: charlie, amountCents: 1 },
    ]);
    const total = [...positions.values()].reduce((sum, position) => sum + position.netCents, 0);
    expect(total).toBe(0);
  });

  it("returns a zero position for users without balances", () => {
    const positions = calculateNetPositions([]);
    expect(positions.size).toBe(0);
    expect(getNetPosition(positions, alice.id)).toEqual({ owedCents: 0, owesCents: 0, netCents: 0 });
  });
});
