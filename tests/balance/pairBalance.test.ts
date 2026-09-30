import { describe, expect, it } from "vitest";

import { netOwedCents, previewExpenseEffect } from "@/lib/balance/pairBalance";

const alice = { id: 1, name: "Alice" };
const bob = { id: 2, name: "Bob" };
const charlie = { id: 3, name: "Charlie" };

// Bob owes Alice $80, Charlie owes Alice $50.
const balances = [
  { from: bob, to: alice, amountCents: 8000 },
  { from: charlie, to: alice, amountCents: 5000 },
];

describe("netOwedCents", () => {
  it("reads a debt in either direction", () => {
    expect(netOwedCents(balances, bob.id, alice.id)).toBe(8000);
    expect(netOwedCents(balances, alice.id, bob.id)).toBe(-8000);
  });

  it("returns zero for a settled pair", () => {
    expect(netOwedCents(balances, bob.id, charlie.id)).toBe(0);
  });
});

describe("previewExpenseEffect", () => {
  it("increases an existing debt in the same direction", () => {
    // Alice pays $20 for Bob: Bob owes Alice $100.
    expect(previewExpenseEffect(balances, alice, bob, 2000)).toEqual({
      before: { from: bob, to: alice, amountCents: 8000 },
      after: { from: bob, to: alice, amountCents: 10000 },
    });
  });

  it("reduces a debt in the other direction", () => {
    // Bob pays $30 for Alice: Bob now owes Alice only $50.
    expect(previewExpenseEffect(balances, bob, alice, 3000).after).toEqual({ from: bob, to: alice, amountCents: 5000 });
  });

  it("settles a debt exactly", () => {
    expect(previewExpenseEffect(balances, bob, alice, 8000).after).toBeNull();
  });

  it("flips the direction when the payment exceeds the debt", () => {
    // Bob pays $100 for Alice: Alice now owes Bob $20.
    expect(previewExpenseEffect(balances, bob, alice, 10000).after).toEqual({ from: alice, to: bob, amountCents: 2000 });
  });

  it("creates a new debt between settled people", () => {
    expect(previewExpenseEffect(balances, bob, charlie, 1500)).toEqual({
      before: null,
      after: { from: charlie, to: bob, amountCents: 1500 },
    });
  });
});
