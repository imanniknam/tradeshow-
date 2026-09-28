import { WalletIcon } from "lucide-react";

import { BalanceList } from "@/components/balances/BalanceList";
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { ExpenseList } from "@/components/expenses/ExpenseList";

export default function HomePage() {
  return (
    <>
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <WalletIcon className="size-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-lg leading-tight font-semibold tracking-tight">SplitLite</h1>
              <p className="hidden text-sm text-muted-foreground sm:block">Track shared expenses and who owes whom.</p>
            </div>
          </div>
          <AddExpenseModal />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-start gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-label="Expenses" className="order-2 lg:order-1">
          <ExpenseList />
        </section>
        <section aria-label="Balances" className="order-1 lg:sticky lg:top-8 lg:order-2">
          <BalanceList />
        </section>
      </main>
    </>
  );
}
