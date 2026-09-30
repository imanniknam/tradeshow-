"use client";

import { ArrowRightIcon, ReceiptTextIcon } from "lucide-react";
import { useState } from "react";

import { AddExpenseButton } from "@/components/expenses/AddExpenseModal";
import { DeleteExpenseButton } from "@/components/expenses/DeleteExpenseButton";
import { Panel, PanelHeader } from "@/components/shared/Panel";
import { QueryError } from "@/components/shared/QueryError";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserAvatar } from "@/components/users/UserAvatar";
import { useExpenses, useUsers } from "@/lib/api/queries";
import { formatDateTime, formatRelativeDate, pluralize } from "@/lib/format";
import { formatCents } from "@/lib/money";
import type { ExpenseDto, UserDto } from "@/lib/types";

const EVERYONE = "all";

export function ExpenseList() {
  const { data: expenses, error, isPending, isFetching, refetch } = useExpenses();
  const users = useUsers();
  const [personId, setPersonId] = useState(EVERYONE);

  const person = users.data?.find((user) => String(user.id) === personId);
  const visible = person
    ? expenses?.filter(({ paidBy, expenseFor }) => paidBy.id === person.id || expenseFor.id === person.id)
    : expenses;

  let description: string | undefined;
  if (expenses && visible) {
    description = person
      ? `${visible.length} of ${expenses.length} involving ${person.name}`
      : `${pluralize(expenses.length, "expense")}, newest first`;
  }

  return (
    <Panel aria-labelledby="expenses-heading">
      <PanelHeader
        titleId="expenses-heading"
        title="All expenses"
        description={description}
        action={
          <>
            {isFetching && !isPending && <Spinner className="text-muted-foreground" aria-label="Refreshing expenses" />}
            {users.data && expenses && expenses.length > 0 && (
              <Select value={personId} onValueChange={setPersonId}>
                <SelectTrigger size="sm" aria-label="Filter by person" className="min-w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="end">
                  <SelectItem value={EVERYONE}>Everyone</SelectItem>
                  {users.data.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      <UserAvatar user={user} size="xs" />
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </>
        }
      />

      {isPending ? (
        <ExpenseListSkeleton />
      ) : error ? (
        <div className="p-4 sm:p-5">
          <QueryError title="Couldn't load expenses" error={error} onRetry={() => refetch()} isRetrying={isFetching} />
        </div>
      ) : expenses.length === 0 ? (
        <Empty className="py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptTextIcon />
            </EmptyMedia>
            <EmptyTitle>No expenses yet</EmptyTitle>
            <EmptyDescription>Record the first payment someone made for someone else.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <AddExpenseButton variant="outline" />
          </EmptyContent>
        </Empty>
      ) : visible && visible.length === 0 ? (
        <Empty className="py-14">
          <EmptyHeader>
            <EmptyTitle>Nothing involving {person?.name}</EmptyTitle>
            <EmptyDescription>No expense was paid by or for them yet.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={() => setPersonId(EVERYONE)}>
              Show everyone
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <ExpenseTable expenses={visible ?? []} />
          <ExpenseRows expenses={visible ?? []} />
        </>
      )}
    </Panel>
  );
}

function Person({ user }: { user: UserDto }) {
  return (
    <span className="flex items-center gap-2">
      <UserAvatar user={user} size="sm" />
      <span className="truncate">{user.name}</span>
    </span>
  );
}

function ExpenseDate({ iso, className }: { iso: string; className?: string }) {
  return (
    <time dateTime={iso} title={formatDateTime(iso)} className={className}>
      {formatRelativeDate(iso)}
    </time>
  );
}

/** Tablet and up: a real data table. */
function ExpenseTable({ expenses }: { expenses: ExpenseDto[] }) {
  return (
    <div className="hidden md:block">
      <Table aria-label="Expenses" className="table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-24 pl-5 text-xs font-medium text-muted-foreground">Date</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground">Description</TableHead>
            <TableHead className="w-32 text-xs font-medium text-muted-foreground">Paid by</TableHead>
            <TableHead className="w-32 text-xs font-medium text-muted-foreground">For</TableHead>
            <TableHead className="w-28 text-right text-xs font-medium text-muted-foreground">Amount</TableHead>
            <TableHead className="w-14 pr-3">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id} data-testid="expense-row" className="h-13">
              <TableCell className="pl-5 text-muted-foreground tabular-nums">
                <ExpenseDate iso={expense.createdAt} />
              </TableCell>
              <TableCell className="truncate font-medium" title={expense.description}>
                {expense.description}
              </TableCell>
              <TableCell>
                <Person user={expense.paidBy} />
              </TableCell>
              <TableCell>
                <Person user={expense.expenseFor} />
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatCents(expense.amountCents)}
              </TableCell>
              <TableCell className="pr-3 text-right">
                <DeleteExpenseButton expense={expense} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Phones: two-line rows that keep the payer → recipient direction obvious. */
function ExpenseRows({ expenses }: { expenses: ExpenseDto[] }) {
  return (
    <ul aria-label="Expenses" className="divide-y md:hidden">
      {expenses.map((expense) => {
        const { id, paidBy, expenseFor, amountCents, description, createdAt } = expense;
        return (
          <li key={id} data-testid="expense-row" className="flex items-start gap-3 py-3 pr-2 pl-4">
            <UserAvatar user={paidBy} className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate font-medium" title={description}>
                  {description}
                </p>
                <p className="shrink-0 font-semibold tabular-nums">{formatCents(amountCents)}</p>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <p className="flex min-w-0 items-center gap-1">
                  <span className="truncate">{paidBy.name}</span>
                  <ArrowRightIcon aria-hidden className="size-3 shrink-0" />
                  <span className="sr-only">paid for</span>
                  <span className="truncate">{expenseFor.name}</span>
                </p>
                <ExpenseDate iso={createdAt} className="shrink-0" />
              </div>
            </div>
            <DeleteExpenseButton expense={expense} className="size-9 shrink-0" />
          </li>
        );
      })}
    </ul>
  );
}

function ExpenseListSkeleton() {
  return (
    <div aria-busy aria-label="Loading expenses" className="divide-y">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex h-13 items-center gap-4 px-4 sm:px-5">
          <Skeleton className="hidden h-3.5 w-14 md:block" />
          <Skeleton className="h-3.5 flex-1 md:max-w-48" />
          <Skeleton className="ml-auto hidden h-3.5 w-20 md:block" />
          <Skeleton className="hidden h-3.5 w-20 md:block" />
          <Skeleton className="h-3.5 w-14" />
        </div>
      ))}
    </div>
  );
}
