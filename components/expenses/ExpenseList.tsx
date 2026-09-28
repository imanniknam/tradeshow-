"use client";

import { ReceiptTextIcon } from "lucide-react";

import { QueryError } from "@/components/shared/QueryError";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { UserAvatar } from "@/components/users/UserAvatar";
import { useExpenses } from "@/lib/api/queries";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatCents } from "@/lib/money";
import type { ExpenseDto } from "@/lib/types";

export function ExpenseList() {
  const { data: expenses, error, isPending, isFetching, refetch } = useExpenses();

  const totalCents = expenses?.reduce((sum, expense) => sum + expense.amountCents, 0) ?? 0;

  return (
    <Card aria-labelledby="expenses-heading">
      <CardHeader>
        <CardTitle id="expenses-heading" className="text-base">
          Expenses
        </CardTitle>
        <CardDescription>
          {expenses && expenses.length > 0
            ? `${expenses.length} ${expenses.length === 1 ? "expense" : "expenses"} · ${formatCents(totalCents)} total`
            : "Every payment made on someone else's behalf."}
        </CardDescription>
        {isFetching && !isPending && (
          <CardAction>
            <Spinner className="text-muted-foreground" aria-label="Refreshing expenses" />
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {isPending ? (
          <ExpenseListSkeleton />
        ) : error ? (
          <QueryError title="Couldn't load expenses" error={error} onRetry={() => refetch()} isRetrying={isFetching} />
        ) : expenses.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptTextIcon />
              </EmptyMedia>
              <EmptyTitle>No expenses yet</EmptyTitle>
              <EmptyDescription>Add your first expense to start tracking who owes whom.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul aria-label="Expenses" className="-my-3 divide-y">
            {expenses.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ExpenseRow({ expense }: { expense: ExpenseDto }) {
  const { paidBy, expenseFor, amountCents, description, createdAt } = expense;

  return (
    <li className="flex items-center gap-3 py-3">
      <UserAvatar user={paidBy} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium" title={description}>
          {description}
        </p>
        <p className="flex flex-wrap gap-x-1.5 text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{paidBy.name}</span> paid for{" "}
            <span className="font-medium text-foreground">{expenseFor.name}</span>
          </span>
          <span aria-hidden className="max-sm:hidden">
            ·
          </span>
          <time dateTime={createdAt} title={formatDateTime(createdAt)} className="whitespace-nowrap max-sm:basis-full max-sm:text-xs">
            {formatDate(createdAt)}
          </time>
        </p>
      </div>
      <p className="shrink-0 text-right font-semibold tabular-nums">{formatCents(amountCents)}</p>
    </li>
  );
}

function ExpenseListSkeleton() {
  return (
    <div aria-busy aria-label="Loading expenses" className="-my-3 divide-y">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 py-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3.5 w-3/5" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
