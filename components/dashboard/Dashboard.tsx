"use client";

import { useState } from "react";

import { BalanceList } from "@/components/balances/BalanceList";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { MobileBottomNav, MobileTopBar } from "@/components/dashboard/MobileNav";
import { StatCards } from "@/components/dashboard/StatCards";
import type { DashboardView } from "@/components/dashboard/views";
import { AddExpenseButton, AddExpenseProvider } from "@/components/expenses/AddExpenseModal";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { cn } from "@/lib/utils";

/**
 * Single-page dashboard. On desktop both views sit side by side; on small
 * screens the bottom navigation switches between them.
 */
export function Dashboard() {
  const [view, setView] = useState<DashboardView>("expenses");

  function changeMobileView(nextView: DashboardView) {
    setView(nextView);
    window.scrollTo({ top: 0 });
  }

  return (
    <AddExpenseProvider>
      <div className="flex min-h-dvh">
        <AppSidebar activeView={view} onNavigate={setView} />

        <div className="flex min-w-0 flex-1 flex-col">
          <MobileTopBar />

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-5 pb-24 sm:px-6 lg:px-8 lg:pt-8 lg:pb-10">
            <header className="mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-6">
              <div>
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Expenses</h1>
                <p className="mt-0.5 text-muted-foreground">View and manage all expenses between users</p>
              </div>
              <AddExpenseButton size="lg" className="shadow-sm shadow-primary/25 max-sm:w-full" />
            </header>

            <StatCards />

            <div className="mt-5 grid items-start gap-5 sm:mt-6 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
              <div className={cn(view !== "expenses" && "max-lg:hidden")}>
                <ExpenseList />
              </div>
              <div className={cn("lg:sticky lg:top-8", view !== "balances" && "max-lg:hidden")}>
                <BalanceList />
              </div>
            </div>
          </main>
        </div>
      </div>

      <MobileBottomNav view={view} onChange={changeMobileView} />
    </AddExpenseProvider>
  );
}
