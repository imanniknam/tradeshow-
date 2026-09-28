import type { Page } from "@playwright/test";

/** On small screens the bottom navigation switches views; on desktop both are always visible. */
export async function showView(page: Page, view: "Expenses" | "Balances") {
  const mobileNav = page.getByRole("navigation", { name: "Views" });
  if (await mobileNav.isVisible()) {
    await mobileNav.getByRole("button", { name: view }).click();
  }
}

export async function selectUser(page: Page, label: "Paid by" | "Expense for", name: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name, exact: true }).click();
}

/** Expense rows render as a table on desktop and as a list on mobile; only one is visible. */
export function visibleExpenseRows(page: Page) {
  return page.getByTestId("expense-row").filter({ visible: true });
}
