"use client";

import { Panel, PanelHeader } from "@/components/shared/Panel";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/users/UserAvatar";
import { useBalances, useUsers } from "@/lib/api/queries";
import { calculateNetPositions, getNetPosition, type NetPosition } from "@/lib/balance/netPositions";
import { formatCents } from "@/lib/money";
import type { UserDto } from "@/lib/types";
import { cn } from "@/lib/utils";

/** One card per person: what they are owed, what they owe and where they stand overall. */
export function PeopleSummary() {
  const users = useUsers();
  const balances = useBalances();
  const positions = balances.data ? calculateNetPositions(balances.data) : undefined;

  return (
    <Panel aria-labelledby="people-summary-heading">
      <PanelHeader
        titleId="people-summary-heading"
        title="Per-person summary"
        description="Overall position of each person across all balances"
      />
      <ul aria-label="People" className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-4">
        {users.data && positions
          ? users.data.map((user) => (
              <PersonCard key={user.id} user={user} position={getNetPosition(positions, user.id)} />
            ))
          : Array.from({ length: 4 }, (_, index) => (
              <li key={index} className="rounded-lg border p-4">
                <Skeleton className="size-9 rounded-full" />
                <Skeleton className="mt-3 h-6 w-24" />
                <Skeleton className="mt-3 h-4 w-full" />
              </li>
            ))}
      </ul>
    </Panel>
  );
}

function PersonCard({ user, position: { owedCents, owesCents, netCents } }: { user: UserDto; position: NetPosition }) {
  const status = netCents > 0 ? "Is owed overall" : netCents < 0 ? "Owes overall" : "Settled up";

  return (
    <li className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <UserAvatar user={user} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{user.name}</p>
          <p className="text-xs text-muted-foreground">{status}</p>
        </div>
      </div>
      <p
        className={cn(
          "mt-3 text-xl font-semibold tracking-tight tabular-nums",
          netCents > 0 ? "text-success" : netCents < 0 ? "text-rose-600" : "text-muted-foreground",
        )}
      >
        {netCents === 0 ? formatCents(0) : `${netCents > 0 ? "+" : "−"}${formatCents(Math.abs(netCents))}`}
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Owed to them</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{formatCents(owedCents)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">They owe</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{formatCents(owesCents)}</dd>
        </div>
      </dl>
    </li>
  );
}
