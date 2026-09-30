"use client";

import { Tabs } from "radix-ui";

import { BalanceList } from "@/components/balances/BalanceList";
import { NetPositions } from "@/components/balances/NetPositions";
import { BrandMark } from "@/components/dashboard/BrandMark";
import { SummaryStrip } from "@/components/dashboard/SummaryStrip";
import { DASHBOARD_VIEWS, useDashboardView, type DashboardView } from "@/components/dashboard/views";
import { AddExpenseButton, AddExpenseProvider } from "@/components/expenses/AddExpenseModal";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { useBalances, useExpenses } from "@/lib/api/queries";

/**
 * The single page: a header with the Expenses / Balances tabs and the
 * Add Expense action, followed by the headline figures and the active view.
 */
export function Dashboard() {
  const [view, setView] = useDashboardView();

  function changeView(next: DashboardView) {
    setView(next);
    window.scrollTo({ top: 0 });
  }

  return (
    <AddExpenseProvider>
      <Tabs.Root value={view} onValueChange={(next) => changeView(next as DashboardView)} className="min-h-dvh">
        <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex h-14 items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <BrandMark />
                <h1 className="font-semibold tracking-tight">
                  SplitLite<span className="sr-only"> — shared expenses</span>
                </h1>
              </div>
              <AddExpenseButton />
            </div>
            <ViewTabs />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pt-5 pb-16 sm:px-6 sm:pt-8">
          <SummaryStrip />

          <Tabs.Content value="expenses" className="mt-5 outline-none sm:mt-6">
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
              <ExpenseList />
              <aside className="max-lg:hidden lg:sticky lg:top-32">
                <BalanceList compact onShowAll={() => changeView("balances")} />
              </aside>
            </div>
          </Tabs.Content>

          <Tabs.Content value="balances" className="mt-5 outline-none sm:mt-6">
            <div className="grid items-start gap-6 lg:grid-cols-2">
              <BalanceList />
              <NetPositions />
            </div>
          </Tabs.Content>
        </main>
      </Tabs.Root>
    </AddExpenseProvider>
  );
}

function ViewTabs() {
  const expenses = useExpenses();
  const balances = useBalances();
  const counts: Record<DashboardView, number | undefined> = {
    expenses: expenses.data?.length,
    balances: balances.data?.length,
  };

  return (
    <Tabs.List aria-label="Views" className="-mb-px flex gap-6">
      {DASHBOARD_VIEWS.map(({ id, label }) => (
        <Tabs.Trigger
          key={id}
          value={id}
          className="group relative flex items-center gap-2 pt-1 pb-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground data-[state=active]:text-foreground"
        >
          {label}
          {counts[id] !== undefined && (
            <span className="rounded-full bg-muted px-1.5 py-px text-[11px] leading-4 font-medium text-muted-foreground tabular-nums group-data-[state=active]:bg-foreground group-data-[state=active]:text-background">
              {counts[id]}
            </span>
          )}
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-transparent group-focus-visible:bg-ring group-data-[state=active]:bg-foreground"
          />
        </Tabs.Trigger>
      ))}
    </Tabs.List>
  );
}
