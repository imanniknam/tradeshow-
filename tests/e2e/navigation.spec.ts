import { expect, test } from "@playwright/test";

import { showView, visibleExpenseRows } from "./helpers";

test("switches between the Expenses and Balances views", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Expenses" })).toBeVisible();
  await expect(visibleExpenseRows(page).first()).toBeVisible();

  await showView(page, "Balances");
  await expect(page.getByRole("heading", { level: 1, name: "Balances" })).toBeVisible();
  await expect(page.getByRole("list", { name: "People" })).toContainText("Alice");
  await expect(page.getByRole("list", { name: "Balances" })).toBeVisible();
  await expect(visibleExpenseRows(page)).toHaveCount(0);

  await showView(page, "Expenses");
  await expect(page.getByRole("heading", { level: 1, name: "Expenses" })).toBeVisible();
  await expect(visibleExpenseRows(page).first()).toBeVisible();
});
