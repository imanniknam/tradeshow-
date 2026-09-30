import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

export const queryKeys = {
  users: ["users"] as const,
  expenses: ["expenses"] as const,
  balances: ["balances"] as const,
};

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users, queryFn: api.getUsers, staleTime: Infinity });
}

export function useExpenses() {
  return useQuery({ queryKey: queryKeys.expenses, queryFn: api.getExpenses });
}

export function useBalances() {
  return useQuery({ queryKey: queryKeys.balances, queryFn: api.getBalances });
}

/** Refetches everything derived from the expense ledger. */
function useRefreshLedger() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses }),
      queryClient.invalidateQueries({ queryKey: queryKeys.balances }),
    ]);
}

export function useCreateExpense() {
  const refreshLedger = useRefreshLedger();
  return useMutation({
    mutationFn: api.createExpense,
    // Returning the promise keeps the mutation pending until both lists are fresh.
    onSuccess: refreshLedger,
  });
}

export function useDeleteExpense() {
  const refreshLedger = useRefreshLedger();
  return useMutation({
    mutationFn: api.deleteExpense,
    onSuccess: refreshLedger,
    // A 404 means someone else already deleted it; refresh so the row disappears.
    onError: refreshLedger,
  });
}
