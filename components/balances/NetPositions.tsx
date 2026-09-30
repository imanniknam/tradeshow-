"use client";

import { Panel, PanelHeader } from "@/components/shared/Panel";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/users/UserAvatar";
import { useBalances, useUsers } from "@/lib/api/queries";
import { calculateNetPositions, getNetPosition } from "@/lib/balance/netPositions";
import { formatCents } from "@/lib/money";
import type { UserDto } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Each person's overall position across all their balances, with a bar that
 * grows right when they get money back and left when they owe.
 */
export function NetPositions() {
  const users = useUsers();
  const balances = useBalances();

  const positions = balances.data && calculateNetPositions(balances.data);
  const rows = users.data && positions && users.data.map((user) => ({ user, ...getNetPosition(positions, user.id) }));
  const scale = Math.max(1, ...(rows ?? []).map((row) => Math.abs(row.netCents)));

  return (
    <Panel aria-labelledby="net-heading">
      <PanelHeader titleId="net-heading" title="Net position" description="What each person gets back or owes overall" />

      <ul aria-label="People" className="divide-y">
        {rows
          ? rows.map((row) => <PositionRow key={row.user.id} {...row} scale={scale} />)
          : Array.from({ length: 4 }, (_, index) => (
              <li key={index} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="ml-auto h-2 w-32" />
              </li>
            ))}
      </ul>
    </Panel>
  );
}

interface PositionRowProps {
  user: UserDto;
  owedCents: number;
  owesCents: number;
  netCents: number;
  /** Largest absolute net across all people; the bars are drawn relative to it. */
  scale: number;
}

function PositionRow({ user, owedCents, owesCents, netCents, scale }: PositionRowProps) {
  const width = `${(Math.abs(netCents) / scale) * 100}%`;
  const status =
    netCents > 0 ? `gets back ${formatCents(netCents)}` : netCents < 0 ? `owes ${formatCents(-netCents)}` : "settled up";

  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <UserAvatar user={user} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{user.name}</p>
        <p
          className={cn(
            "text-xs tabular-nums",
            netCents > 0 ? "text-positive" : netCents < 0 ? "text-negative" : "text-muted-foreground",
          )}
        >
          {status}
        </p>
      </div>

      <div
        aria-hidden
        title={`Owed ${formatCents(owedCents)} · Owes ${formatCents(owesCents)}`}
        className="relative flex h-2 w-28 shrink-0 rounded-full bg-muted sm:w-40"
      >
        <span className="absolute inset-y-[-3px] left-1/2 w-px bg-foreground/15" />
        <span className="flex flex-1 justify-end">
          {netCents < 0 && <span className="h-full rounded-l-full bg-negative/80" style={{ width }} />}
        </span>
        <span className="flex flex-1">
          {netCents > 0 && <span className="h-full rounded-r-full bg-positive/80" style={{ width }} />}
        </span>
      </div>
    </li>
  );
}
