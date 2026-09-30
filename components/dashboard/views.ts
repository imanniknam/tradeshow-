import { useCallback, useSyncExternalStore } from "react";

export type DashboardView = "expenses" | "balances";

export const DASHBOARD_VIEWS: ReadonlyArray<{ id: DashboardView; label: string }> = [
  { id: "expenses", label: "Expenses" },
  { id: "balances", label: "Balances" },
];

const DEFAULT_VIEW: DashboardView = "expenses";
const listeners = new Set<() => void>();

function readView(): DashboardView {
  return window.location.hash === "#balances" ? "balances" : DEFAULT_VIEW;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

/**
 * The active view, kept in the URL hash (`/#balances`) so it survives a
 * reload, can be shared, and works with the browser's back button.
 */
export function useDashboardView(): [DashboardView, (view: DashboardView) => void] {
  const view = useSyncExternalStore(subscribe, readView, () => DEFAULT_VIEW);

  const setView = useCallback((next: DashboardView) => {
    if (next === readView()) return;
    const { pathname, search } = window.location;
    window.history.pushState(null, "", next === DEFAULT_VIEW ? pathname + search : `#${next}`);
    listeners.forEach((listener) => listener());
  }, []);

  return [view, setView];
}
