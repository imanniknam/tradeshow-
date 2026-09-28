import { calculateBalances, type Transaction } from "@/lib/balance/calculateBalances";
import { prisma } from "@/lib/prisma";
import type { BalanceDto } from "@/lib/types";

/**
 * Sums expenses per (payer, recipient) pair in the database, then nets the
 * pairs with the shared balance algorithm.
 */
export async function getBalances(): Promise<BalanceDto[]> {
  const [users, totals] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true } }),
    prisma.expense.groupBy({
      by: ["paidById", "expenseForId"],
      _sum: { amountCents: true },
    }),
  ]);

  const usersById = new Map(users.map((user) => [user.id, user]));

  const transactions = totals.flatMap(({ paidById, expenseForId, _sum }): Transaction[] => {
    const paidBy = usersById.get(paidById);
    const expenseFor = usersById.get(expenseForId);
    const amountCents = _sum.amountCents ?? 0;
    return paidBy && expenseFor && amountCents > 0 ? [{ paidBy, expenseFor, amountCents }] : [];
  });

  return calculateBalances(transactions);
}
