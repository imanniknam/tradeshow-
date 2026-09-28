import type { Page } from "@playwright/test";

/** Switches views via the sidebar (desktop) or the bottom navigation (mobile), whichever is visible. */
export async function showView(page: Page, view: "Expenses" | "Balances") {
  await page
    .getByRole("navigation", { name: /^(Sections|Views)$/ })
    .filter({ visible: true })
    .getByRole("button", { name: view })
    .click();
}

export async function selectUser(page: Page, label: "Paid by" | "Expense for", name: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name, exact: true }).click();
}

/** Expense rows render as a table on desktop and as a list on mobile; only one is visible. */
export function visibleExpenseRows(page: Page) {
  return page.getByTestId("expense-row").filter({ visible: true });
}
