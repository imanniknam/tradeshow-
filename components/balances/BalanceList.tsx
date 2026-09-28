"use client";

import { ArrowRightIcon, CircleCheckIcon } from "lucide-react";

import { Panel, PanelHeader } from "@/components/shared/Panel";
import { QueryError } from "@/components/shared/QueryError";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { UserAvatar } from "@/components/users/UserAvatar";
import { useBalances } from "@/lib/api/queries";
import { formatCents } from "@/lib/money";
import type { BalanceDto } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BalanceListProps {
  /** "side": narrow column next to the expenses. "full": the dedicated Balances view. */
  layout?: "side" | "full";
}

export function BalanceList({ layout = "side" }: BalanceListProps) {
  const { data: balances, error, isPending, isFetching, refetch } = useBalances();

  return (
    <Panel id="balances" aria-labelledby="balances-heading">
      <PanelHeader
        titleId="balances-heading"
        title="Current Balances"
        description="Who owes whom, after netting both directions"
        action={
          isFetching && !isPending ? (
            <Spinner className="text-muted-foreground" aria-label="Refreshing balances" />
          ) : undefined
        }
      />

      <div className="p-3 sm:p-4">
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
              <EmptyTitle>No outstanding balances</EmptyTitle>
              <EmptyDescription>Everyone is settled up.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul aria-label="Balances" className={cn("grid gap-2.5", layout === "full" && "md:grid-cols-2")}>
            {balances.map((balance) => (
              <BalanceCard key={`${balance.from.id}-${balance.to.id}`} balance={balance} />
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

function BalanceCard({ balance: { from, to, amountCents } }: { balance: BalanceDto }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card p-3.5 transition-colors hover:border-primary/30 hover:bg-accent/40">
      <UserAvatar user={from} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate">
          <span className="font-semibold">{from.name}</span> <span className="text-muted-foreground">owes</span>{" "}
          <span className="font-semibold">{to.name}</span>
        </p>
        <div aria-hidden className="mt-1.5 flex items-center gap-1">
          <UserAvatar user={from} size="xs" />
          <ArrowRightIcon className="size-3.5 text-rose-500" />
          <UserAvatar user={to} size="xs" />
        </div>
      </div>
      <p className="shrink-0 text-base font-semibold text-rose-600 tabular-nums">{formatCents(amountCents)}</p>
    </li>
  );
}

function BalanceListSkeleton() {
  return (
    <div aria-busy aria-label="Loading balances" className="grid gap-2.5">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-lg border p-3.5">
          <Skeleton className="size-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3.5 w-16" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
