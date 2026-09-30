import { expect, type APIRequestContext, type Page } from "@playwright/test";

import type { BalanceDto } from "@/lib/types";

/** Switches between the Expenses and Balances tabs in the header. */
export async function showView(page: Page, view: "Expenses" | "Balances") {
  const tab = page.getByRole("tablist", { name: "Views" }).getByRole("tab", { name: new RegExp(`^${view}`) });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-selected", "true");
}

export async function selectUser(page: Page, label: "Paid by" | "Expense for", name: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name, exact: true }).click();
}

/** Expense rows render as a table on desktop and as a list on mobile; only one is visible. */
export function visibleExpenseRows(page: Page) {
  return page.getByTestId("expense-row").filter({ visible: true });
}

export async function openAddExpense(page: Page) {
  await page.getByRole("button", { name: "Add Expense" }).first().click();
  const dialog = page.getByRole("dialog", { name: "New expense" });
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Net amount in cents that `debtor` owes `creditor` (negative if reversed), read from the API. */
export async function netOwedCents(request: APIRequestContext, debtor: string, creditor: string) {
  const response = await request.get("/api/balances");
  expect(response.ok()).toBeTruthy();
  const { data } = (await response.json()) as { data: BalanceDto[] };

  const balance = data.find(
    ({ from, to }) =>
      (from.name === debtor && to.name === creditor) || (from.name === creditor && to.name === debtor),
  );
  if (!balance) return 0;
  return balance.from.name === debtor ? balance.amountCents : -balance.amountCents;
}

export function usd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/** "Charlie owes David $42.50", "David owes Charlie $1.00" or "Settled up" for a signed net amount. */
export function describeNet(debtor: string, creditor: string, cents: number) {
  if (cents > 0) return `${debtor} owes ${creditor} ${usd(cents)}`;
  if (cents < 0) return `${creditor} owes ${debtor} ${usd(-cents)}`;
  return "Settled up";
}
