"use client";

import { ArrowLeftRightIcon, ScaleIcon, WalletIcon, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useBalances, useExpenses } from "@/lib/api/queries";
import { formatCents } from "@/lib/money";
import { countRecent, sumCents } from "@/lib/stats";
import { cn } from "@/lib/utils";

export function StatCards() {
  const expenses = useExpenses();
  const balances = useBalances();

  const total = expenses.data ? sumCents(expenses.data) : 0;
  const count = expenses.data?.length ?? 0;
  const thisWeek = expenses.data ? countRecent(expenses.data, 7) : 0;
  const largestBalance = balances.data?.[0];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      <StatCard
        icon={WalletIcon}
        tone="indigo"
        label="Total Expenses"
        value={expenses.data ? formatCents(total) : null}
        hint={count > 0 ? `Avg ${formatCents(Math.round(total / count))} per expense` : "Nothing recorded yet"}
        className="col-span-2 flex-row lg:col-span-1"
      />
      <StatCard
        icon={ArrowLeftRightIcon}
        tone="sky"
        label="Transactions"
        value={expenses.data ? String(count) : null}
        hint={
          thisWeek > 0 ? <span className="font-medium text-success">+{thisWeek} this week</span> : "None this week"
        }
      />
      <StatCard
        icon={ScaleIcon}
        tone="emerald"
        label="Open Balances"
        value={balances.data ? String(balances.data.length) : null}
        hint={largestBalance ? `Largest ${formatCents(largestBalance.amountCents)}` : "Everyone is settled up"}
      />
    </div>
  );
}

const TONES = {
  indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
} as const;

interface StatCardProps {
  icon: LucideIcon;
  tone: keyof typeof TONES;
  label: string;
  /** `null` while loading. */
  value: string | null;
  hint: ReactNode;
  className?: string;
}

function StatCard({ icon: Icon, tone, label, value, hint, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-xl border bg-card p-4 shadow-xs sm:flex-row sm:gap-4 sm:p-5",
        className,
      )}
    >
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset", TONES[tone])}>
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
        {value === null ? (
          <Skeleton className="mt-1.5 h-7 w-20" />
        ) : (
          <p className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</p>
        )}
        <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}
