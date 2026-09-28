"use client";

import { BrandMark } from "@/components/dashboard/BrandMark";
import { DASHBOARD_VIEWS, type DashboardView } from "@/components/dashboard/views";
import { cn } from "@/lib/utils";

export function MobileTopBar() {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-2.5 border-b bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
      <BrandMark className="size-8" />
      <span className="font-semibold tracking-tight">SplitLite</span>
    </div>
  );
}

interface MobileBottomNavProps {
  view: DashboardView;
  onChange: (view: DashboardView) => void;
}

/** Switches between the Expenses and Balances views on small screens. */
export function MobileBottomNav({ view, onChange }: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Views"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-2">
        {DASHBOARD_VIEWS.map(({ id, label, icon: Icon }) => {
          const isActive = view === id;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-16 w-full flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon aria-hidden className="size-5" />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
