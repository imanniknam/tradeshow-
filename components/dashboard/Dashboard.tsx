"use client";

import { useState } from "react";

import { BalanceList } from "@/components/balances/BalanceList";
import { PeopleSummary } from "@/components/balances/PeopleSummary";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { MobileBottomNav, MobileTopBar } from "@/components/dashboard/MobileNav";
import { StatCards } from "@/components/dashboard/StatCards";
import type { DashboardView } from "@/components/dashboard/views";
import { AddExpenseButton, AddExpenseProvider } from "@/components/expenses/AddExpenseModal";
import { ExpenseList } from "@/components/expenses/ExpenseList";

const VIEW_HEADINGS: Record<DashboardView, { title: string; description: string }> = {
  expenses: { title: "Expenses", description: "View and manage all expenses between users" },
  balances: { title: "Balances", description: "Who owes whom, with transactions in both directions netted" },
};

/**
 * Single-page dashboard with two views, switched from the sidebar (desktop)
 * or the bottom navigation (mobile). On desktop the Expenses view also shows
 * the current balances alongside the table.
 */
export function Dashboard() {
  const [view, setView] = useState<DashboardView>("expenses");
  const heading = VIEW_HEADINGS[view];

  function changeView(nextView: DashboardView) {
    setView(nextView);
    window.scrollTo({ top: 0 });
  }

  return (
    <AddExpenseProvider>
      <div className="flex min-h-dvh">
        <AppSidebar activeView={view} onNavigate={changeView} />

        <div className="flex min-w-0 flex-1 flex-col">
          <MobileTopBar />

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-5 pb-24 sm:px-6 lg:px-8 lg:pt-8 lg:pb-10">
            <header className="mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-6">
              <div>
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{heading.title}</h1>
                <p className="mt-0.5 text-muted-foreground">{heading.description}</p>
              </div>
              <AddExpenseButton size="lg" className="shadow-sm shadow-primary/25 max-sm:w-full" />
            </header>

            <StatCards />

            {view === "expenses" ? (
              <div className="mt-5 grid items-start gap-5 sm:mt-6 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
                <ExpenseList />
                <div className="max-lg:hidden lg:sticky lg:top-8">
                  <BalanceList />
                </div>
              </div>
            ) : (
              <div className="mt-5 grid gap-5 sm:mt-6 sm:gap-6">
                <PeopleSummary />
                <BalanceList layout="full" />
              </div>
            )}
          </main>
        </div>
      </div>

      <MobileBottomNav view={view} onChange={changeView} />
    </AddExpenseProvider>
  );
}
