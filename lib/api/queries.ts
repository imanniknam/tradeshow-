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

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createExpense,
    // Returning the promise keeps the mutation pending until both lists are fresh.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses }),
        queryClient.invalidateQueries({ queryKey: queryKeys.balances }),
      ]),
  });
}
