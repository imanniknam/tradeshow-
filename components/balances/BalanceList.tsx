"use client";

import { ArrowRightIcon, CircleCheckIcon } from "lucide-react";

import { Panel, PanelHeader } from "@/components/shared/Panel";
import { QueryError } from "@/components/shared/QueryError";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { UserAvatar } from "@/components/users/UserAvatar";
import { useBalances } from "@/lib/api/queries";
import { formatCents } from "@/lib/money";
import type { BalanceDto } from "@/lib/types";
import { cn } from "@/lib/utils";

/** How many balances the compact (side column) variant shows before linking to the full view. */
const COMPACT_LIMIT = 5;

interface BalanceListProps {
  /** Narrow side-column variant with a link to the full Balances view. */
  compact?: boolean;
  onShowAll?: () => void;
}

/** Pairwise net balances: "Bob owes Alice $80.00". */
export function BalanceList({ compact = false, onShowAll }: BalanceListProps) {
  const { data: balances, error, isPending, isFetching, refetch } = useBalances();
  const shown = compact ? balances?.slice(0, COMPACT_LIMIT) : balances;
  const hidden = (balances?.length ?? 0) - (shown?.length ?? 0);
  const headingId = compact ? "balances-side-heading" : "balances-heading";

  return (
    <Panel aria-labelledby={headingId}>
      <PanelHeader
        titleId={headingId}
        title="Who owes whom"
        description={compact ? undefined : "Payments in both directions are netted per pair"}
        action={
          isFetching && !isPending ? (
            <Spinner className="text-muted-foreground" aria-label="Refreshing balances" />
          ) : undefined
        }
      />

      {isPending ? (
        <BalanceListSkeleton />
      ) : error ? (
        <div className="p-4">
          <QueryError title="Couldn't load balances" error={error} onRetry={() => refetch()} isRetrying={isFetching} />
        </div>
      ) : balances.length === 0 ? (
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleCheckIcon />
            </EmptyMedia>
            <EmptyTitle>All settled up</EmptyTitle>
            <EmptyDescription>Nobody owes anybody right now.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <ul aria-label="Balances" className="divide-y">
            {shown?.map((balance) => (
              <BalanceRow key={`${balance.from.id}-${balance.to.id}`} balance={balance} compact={compact} />
            ))}
          </ul>
          {compact && onShowAll && (
            <div className="border-t px-2 py-1.5">
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onShowAll}>
                {hidden > 0 ? `View all ${balances.length} balances` : "Open balances view"}
                <ArrowRightIcon />
              </Button>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

function BalanceRow({ balance: { from, to, amountCents }, compact }: { balance: BalanceDto; compact: boolean }) {
  return (
    <li className={cn("flex items-center gap-3 px-4", compact ? "py-3" : "py-3.5 sm:px-5")}>
      <span aria-hidden className="flex shrink-0 -space-x-1.5">
        <UserAvatar user={from} size={compact ? "sm" : "md"} className="ring-2 ring-card" />
        <UserAvatar user={to} size={compact ? "sm" : "md"} className="ring-2 ring-card" />
      </span>
      <p className="min-w-0 flex-1 truncate">
        <span className="font-medium">{from.name}</span> <span className="text-muted-foreground">owes</span>{" "}
        <span className="font-medium">{to.name}</span>
      </p>
      <p className="shrink-0 font-semibold tabular-nums">{formatCents(amountCents)}</p>
    </li>
  );
}

function BalanceListSkeleton() {
  return (
    <div aria-busy aria-label="Loading balances" className="divide-y">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="h-7 w-11 rounded-full" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-14" />
        </div>
      ))}
    </div>
  );
}
