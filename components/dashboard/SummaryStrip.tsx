"use client";

import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useBalances, useExpenses } from "@/lib/api/queries";
import { pluralize } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { filterRecent, sumCents } from "@/lib/stats";
import { cn } from "@/lib/utils";

/** Three headline figures in a single row. Values render only once their data has loaded. */
export function SummaryStrip() {
  const expenses = useExpenses();
  const balances = useBalances();

  const recent = expenses.data && filterRecent(expenses.data, 7);

  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-xl border bg-card sm:grid-cols-3">
      <Metric
        label="Total recorded"
        value={expenses.data && formatCents(sumCents(expenses.data))}
        hint={expenses.data && pluralize(expenses.data.length, "expense")}
        className="max-sm:col-span-2 max-sm:border-b"
      />
      <Metric
        label="Outstanding"
        value={balances.data && formatCents(sumCents(balances.data))}
        hint={
          balances.data &&
          (balances.data.length > 0 ? pluralize(balances.data.length, "open balance") : "Everyone is settled up")
        }
        className="border-r sm:border-l"
      />
      <Metric
        label="Last 7 days"
        value={recent && formatCents(sumCents(recent))}
        hint={recent && pluralize(recent.length, "expense")}
      />
    </dl>
  );
}

interface MetricProps {
  label: string;
  /** `undefined` while loading. */
  value: string | undefined;
  hint: ReactNode;
  className?: string;
}

function Metric({ label, value, hint, className }: MetricProps) {
  return (
    <div className={cn("px-4 py-3.5 sm:px-5 sm:py-4", className)}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1">
        {value === undefined ? (
          <>
            <Skeleton className="h-7 w-24" />
            <Skeleton className="mt-1.5 h-3.5 w-16" />
          </>
        ) : (
          <>
            <span className="block text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
          </>
        )}
      </dd>
    </div>
  );
}
