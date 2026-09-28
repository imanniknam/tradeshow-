"use client";

import { ArrowRightIcon, ReceiptTextIcon } from "lucide-react";

import { AddExpenseButton } from "@/components/expenses/AddExpenseModal";
import { Panel, PanelHeader } from "@/components/shared/Panel";
import { QueryError } from "@/components/shared/QueryError";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserAvatar } from "@/components/users/UserAvatar";
import { useExpenses } from "@/lib/api/queries";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatCents } from "@/lib/money";
import type { ExpenseDto, UserDto } from "@/lib/types";

export function ExpenseList() {
  const { data: expenses, error, isPending, isFetching, refetch } = useExpenses();

  return (
    <Panel id="expenses" aria-labelledby="expenses-heading">
      <PanelHeader
        titleId="expenses-heading"
        title="Recent Expenses"
        description={
          expenses && expenses.length > 0
            ? `${expenses.length} ${expenses.length === 1 ? "transaction" : "transactions"} · newest first`
            : "Every payment made on someone else's behalf"
        }
        action={
          isFetching && !isPending ? (
            <Spinner className="text-muted-foreground" aria-label="Refreshing expenses" />
          ) : undefined
        }
      />

      {isPending ? (
        <ExpenseListSkeleton />
      ) : error ? (
        <div className="p-4 sm:p-5">
          <QueryError title="Couldn't load expenses" error={error} onRetry={() => refetch()} isRetrying={isFetching} />
        </div>
      ) : expenses.length === 0 ? (
        <div className="p-4 sm:p-5">
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptTextIcon />
              </EmptyMedia>
              <EmptyTitle>No expenses yet</EmptyTitle>
              <EmptyDescription>Add your first expense to start tracking who owes whom.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <AddExpenseButton size="sm" />
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <>
          <ExpenseTable expenses={expenses} />
          <ExpenseCards expenses={expenses} />
        </>
      )}
    </Panel>
  );
}

function PersonCell({ user }: { user: UserDto }) {
  return (
    <span className="flex items-center gap-2.5">
      <UserAvatar user={user} size="sm" />
      <span className="font-medium">{user.name}</span>
    </span>
  );
}

function ExpenseDate({ iso, className }: { iso: string; className?: string }) {
  return (
    <time dateTime={iso} title={formatDateTime(iso)} className={className}>
      {formatDate(iso)}
    </time>
  );
}

/** Desktop / tablet: a proper data table. */
function ExpenseTable({ expenses }: { expenses: ExpenseDto[] }) {
  return (
    <div className="hidden md:block">
      <Table aria-label="Expenses">
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            <TableHead className="pl-5">Paid by</TableHead>
            <TableHead>Expense for</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="pr-5 text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id} data-testid="expense-row" className="h-14">
              <TableCell className="pl-5">
                <PersonCell user={expense.paidBy} />
              </TableCell>
              <TableCell>
                <PersonCell user={expense.expenseFor} />
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatCents(expense.amountCents)}</TableCell>
              <TableCell className="max-w-56 truncate text-muted-foreground" title={expense.description}>
                {expense.description}
              </TableCell>
              <TableCell className="pr-5 text-right text-muted-foreground tabular-nums">
                <ExpenseDate iso={expense.createdAt} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Mobile: compact rows that keep the payer → recipient direction obvious. */
function ExpenseCards({ expenses }: { expenses: ExpenseDto[] }) {
  return (
    <ul aria-label="Expenses" className="divide-y md:hidden">
      {expenses.map(({ id, paidBy, expenseFor, amountCents, description, createdAt }) => (
        <li key={id} data-testid="expense-row" className="flex items-center gap-3 px-4 py-3.5">
          <UserAvatar user={paidBy} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 font-medium">
              {paidBy.name}
              <ArrowRightIcon aria-hidden className="size-3.5 text-muted-foreground" />
              <span className="sr-only">paid for</span>
              {expenseFor.name}
            </p>
            <p className="truncate text-muted-foreground" title={description}>
              {description}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-semibold tabular-nums">{formatCents(amountCents)}</p>
            <ExpenseDate iso={createdAt} className="text-xs text-muted-foreground" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ExpenseListSkeleton() {
  return (
    <div aria-busy aria-label="Loading expenses" className="divide-y">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-4 w-16 md:ml-8" />
          <Skeleton className="hidden h-4 flex-1 md:block" />
          <Skeleton className="hidden h-4 w-20 md:block" />
        </div>
      ))}
    </div>
  );
}
