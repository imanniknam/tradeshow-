"use client";

import { BrandMark } from "@/components/dashboard/BrandMark";
import { DASHBOARD_VIEWS, type DashboardView } from "@/components/dashboard/views";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/users/UserAvatar";
import { useBalances, useUsers } from "@/lib/api/queries";
import { calculateNetPositions } from "@/lib/balance/netPositions";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  activeView: DashboardView;
  onNavigate: (view: DashboardView) => void;
}

/** Desktop-only navigation with the list of people and their net positions. */
export function AppSidebar({ activeView, onNavigate }: AppSidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-sidebar lg:flex">
      <div className="flex items-center gap-3 px-5 py-5">
        <BrandMark />
        <div>
          <p className="text-base leading-tight font-semibold tracking-tight">SplitLite</p>
          <p className="text-xs text-muted-foreground">Shared expenses, simplified</p>
        </div>
      </div>

      <nav aria-label="Sections" className="px-3">
        <ul className="grid gap-1">
          {DASHBOARD_VIEWS.map(({ id, label, icon: Icon }) => {
            const isActive = activeView === id;
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={() => onNavigate(id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon aria-hidden className="size-4" />
                  {label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <PeopleList />

      <p className="mt-auto px-5 py-5 text-xs text-muted-foreground">Simple · Fair · Together</p>
    </aside>
  );
}

function PeopleList() {
  const users = useUsers();
  const balances = useBalances();
  const positions = balances.data ? calculateNetPositions(balances.data) : undefined;

  return (
    <section aria-labelledby="people-heading" className="mt-8 px-3">
      <h2 id="people-heading" className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        People
      </h2>
      <ul className="mt-2 grid gap-0.5">
        {users.isPending
          ? Array.from({ length: 4 }, (_, index) => (
              <li key={index} className="flex items-center gap-3 px-3 py-2">
                <Skeleton className="size-7 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </li>
            ))
          : users.data?.map((user) => {
              const net = positions?.get(user.id) ?? 0;
              return (
                <li key={user.id} className="flex items-center gap-3 rounded-lg px-3 py-2">
                  <UserAvatar user={user} size="sm" />
                  <span className="flex-1 truncate font-medium">{user.name}</span>
                  {positions && (
                    <span
                      className={cn(
                        "text-xs font-medium tabular-nums",
                        net > 0 ? "text-success" : net < 0 ? "text-rose-600" : "text-muted-foreground",
                      )}
                      title={net > 0 ? "Is owed overall" : net < 0 ? "Owes overall" : "Settled up"}
                    >
                      {net === 0 ? "settled" : `${net > 0 ? "+" : "−"}${formatCents(Math.abs(net))}`}
                    </span>
                  )}
                </li>
              );
            })}
      </ul>
    </section>
  );
}
