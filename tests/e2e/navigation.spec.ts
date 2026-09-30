import { expect, test } from "@playwright/test";

import { showView, visibleExpenseRows } from "./helpers";

test("switches between the Expenses and Balances views and keeps the view in the URL", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "All expenses" })).toBeVisible();
  await expect(visibleExpenseRows(page).first()).toBeVisible();

  await showView(page, "Balances");
  await expect(page).toHaveURL(/#balances$/);
  await expect(page.getByRole("heading", { name: "Who owes whom" })).toBeVisible();
  await expect(page.getByRole("list", { name: "People" })).toContainText("Alice");
  await expect(page.getByRole("list", { name: "Balances" })).toBeVisible();
  await expect(visibleExpenseRows(page)).toHaveCount(0);

  // The view survives a reload and the back button returns to Expenses.
  await page.reload();
  await expect(page.getByRole("tab", { name: /^Balances/ })).toHaveAttribute("aria-selected", "true");
  await page.goBack();
  await expect(page.getByRole("tab", { name: /^Expenses/ })).toHaveAttribute("aria-selected", "true");
  await expect(visibleExpenseRows(page).first()).toBeVisible();
});

test("filters expenses by person", async ({ page }) => {
  await page.goto("/");
  await expect(visibleExpenseRows(page).first()).toBeVisible();
  const total = await visibleExpenseRows(page).count();

  await page.getByRole("combobox", { name: "Filter by person" }).click();
  await page.getByRole("option", { name: "Charlie", exact: true }).click();

  const rows = visibleExpenseRows(page);
  await expect(rows.first()).toBeVisible();
  for (const row of await rows.all()) {
    await expect(row).toContainText("Charlie");
  }
  await expect(page.getByText(new RegExp(`of ${total} involving Charlie`))).toBeVisible();

  await page.getByRole("combobox", { name: "Filter by person" }).click();
  await page.getByRole("option", { name: "Everyone" }).click();
  await expect(visibleExpenseRows(page)).toHaveCount(total);
});
