import { describe, expect, it } from "vitest";

import { calculateBalances, type BalanceUser, type Transaction } from "@/lib/balance/calculateBalances";

const alice: BalanceUser = { id: 1, name: "Alice" };
const bob: BalanceUser = { id: 2, name: "Bob" };
const charlie: BalanceUser = { id: 3, name: "Charlie" };
const david: BalanceUser = { id: 4, name: "David" };

/** `paidBy -> expenseFor -> dollars`, i.e. `expenseFor` owes `paidBy`. */
function tx(paidBy: BalanceUser, expenseFor: BalanceUser, dollars: number): Transaction {
  return { paidBy, expenseFor, amountCents: Math.round(dollars * 100) };
}

/** Readable summary like "Bob owes Alice 120.00". */
function summarize(transactions: Transaction[]): string[] {
  return calculateBalances(transactions).map(
    ({ from, to, amountCents }) => `${from.name} owes ${to.name} ${(amountCents / 100).toFixed(2)}`,
  );
}

describe("calculateBalances", () => {
  it("returns no balances when there are no transactions", () => {
    expect(calculateBalances([])).toEqual([]);
  });

  it("creates a debt from the recipient to the payer for a single transaction", () => {
    expect(calculateBalances([tx(alice, bob, 50)])).toEqual([{ from: bob, to: alice, amountCents: 5000 }]);
  });

  it("nets opposite transactions between the same users", () => {
    expect(summarize([tx(alice, bob, 100), tx(bob, alice, 40)])).toEqual(["Bob owes Alice 60.00"]);
  });

  it("aggregates multiple transactions in both directions", () => {
    expect(summarize([tx(alice, bob, 100), tx(alice, bob, 50), tx(bob, alice, 30)])).toEqual([
      "Bob owes Alice 120.00",
    ]);
  });

  it("flips the direction when the other user ends up owing", () => {
    expect(summarize([tx(alice, bob, 20), tx(bob, alice, 75)])).toEqual(["Alice owes Bob 55.00"]);
  });

  it("omits pairs whose transactions cancel out to zero", () => {
    expect(calculateBalances([tx(alice, bob, 50), tx(bob, alice, 50)])).toEqual([]);
  });

  it("keeps balances between independent pairs of users separate", () => {
    expect(
      summarize([
        tx(alice, bob, 120),
        tx(alice, charlie, 50),
        tx(bob, david, 30),
        tx(charlie, david, 10),
        tx(david, charlie, 10),
      ]),
    ).toEqual(["Bob owes Alice 120.00", "Charlie owes Alice 50.00", "David owes Bob 30.00"]);
  });

  it("does not transfer debts through intermediaries", () => {
    // Bob owes Alice and Charlie owes Bob; Charlie does not owe Alice directly.
    expect(summarize([tx(alice, bob, 40), tx(bob, charlie, 40)])).toEqual([
      "Bob owes Alice 40.00",
      "Charlie owes Bob 40.00",
    ]);
  });

  it("sums cents exactly without floating-point drift", () => {
    const transactions = Array.from({ length: 10 }, () => tx(alice, bob, 0.1));
    expect(calculateBalances(transactions)).toEqual([{ from: bob, to: alice, amountCents: 100 }]);
  });

  it("ignores transactions where a user paid for themselves", () => {
    expect(calculateBalances([tx(alice, alice, 25)])).toEqual([]);
  });

  it("is independent of transaction order", () => {
    const transactions = [tx(alice, bob, 10), tx(charlie, alice, 5), tx(bob, alice, 3), tx(david, charlie, 7)];
    expect(calculateBalances([...transactions].reverse())).toEqual(calculateBalances(transactions));
  });

  it("rejects non-integer or non-positive amounts", () => {
    expect(() => calculateBalances([{ paidBy: alice, expenseFor: bob, amountCents: 10.5 }])).toThrow(RangeError);
    expect(() => calculateBalances([{ paidBy: alice, expenseFor: bob, amountCents: 0 }])).toThrow(RangeError);
    expect(() => calculateBalances([{ paidBy: alice, expenseFor: bob, amountCents: -100 }])).toThrow(RangeError);
  });
});
