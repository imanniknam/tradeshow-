import { ReceiptTextIcon, ScaleIcon, type LucideIcon } from "lucide-react";

export type DashboardView = "expenses" | "balances";

export const DASHBOARD_VIEWS: ReadonlyArray<{ id: DashboardView; label: string; icon: LucideIcon }> = [
  { id: "expenses", label: "Expenses", icon: ReceiptTextIcon },
  { id: "balances", label: "Balances", icon: ScaleIcon },
];
