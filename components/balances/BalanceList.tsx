"use client";

import { ArrowRightIcon, CircleCheckIcon } from "lucide-react";

import { QueryError } from "@/components/shared/QueryError";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { UserAvatar } from "@/components/users/UserAvatar";
import { useBalances } from "@/lib/api/queries";
import { formatCents } from "@/lib/money";
import type { BalanceDto } from "@/lib/types";

export function BalanceList() {
  const { data: balances, error, isPending, isFetching, refetch } = useBalances();

  return (
    <Card aria-labelledby="balances-heading">
      <CardHeader>
        <CardTitle id="balances-heading" className="text-base">
          Balances
        </CardTitle>
        <CardDescription>Net amounts after offsetting payments in both directions.</CardDescription>
        {isFetching && !isPending && (
          <CardAction>
            <Spinner className="text-muted-foreground" aria-label="Refreshing balances" />
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {isPending ? (
          <BalanceListSkeleton />
        ) : error ? (
          <QueryError title="Couldn't load balances" error={error} onRetry={() => refetch()} isRetrying={isFetching} />
        ) : balances.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CircleCheckIcon />
              </EmptyMedia>
              <EmptyTitle>All settled up</EmptyTitle>
              <EmptyDescription>Nobody owes anybody anything right now.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul aria-label="Balances" className="-my-3 divide-y">
            {balances.map((balance) => (
              <BalanceRow key={`${balance.from.id}-${balance.to.id}`} balance={balance} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function BalanceRow({ balance: { from, to, amountCents } }: { balance: BalanceDto }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <div aria-hidden className="flex shrink-0 items-center gap-1">
        <UserAvatar user={from} size="sm" />
        <ArrowRightIcon className="size-3.5 text-muted-foreground" />
        <UserAvatar user={to} size="sm" />
      </div>
      <p className="min-w-0 flex-1">
        <span className="font-medium">{from.name}</span> <span className="text-muted-foreground">owes</span>{" "}
        <span className="font-medium">{to.name}</span>
      </p>
      <p className="shrink-0 font-semibold tabular-nums">{formatCents(amountCents)}</p>
    </li>
  );
}

function BalanceListSkeleton() {
  return (
    <div aria-busy aria-label="Loading balances" className="-my-3 divide-y">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 py-3">
          <Skeleton className="h-6 w-18 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}
