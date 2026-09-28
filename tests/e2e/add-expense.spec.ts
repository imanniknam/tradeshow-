import { expect, test, type APIRequestContext } from "@playwright/test";

import type { BalanceDto } from "@/lib/types";

import { selectUser, showView, visibleExpenseRows } from "./helpers";

/** Net amount in cents that `debtor` owes `creditor` (negative if reversed). */
async function netOwedCents(request: APIRequestContext, debtor: string, creditor: string) {
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

function usd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

test("adds an expense and updates the expense list and balances", async ({ page, request }) => {
  const description = `Team lunch ${Date.now()}`;
  const owedBefore = await netOwedCents(request, "Charlie", "David");

  await page.goto("/");
  await expect(visibleExpenseRows(page).first()).toBeVisible();

  await page.getByRole("button", { name: "Add Expense" }).click();
  const dialog = page.getByRole("dialog", { name: "Add Expense" });
  await expect(dialog).toBeVisible();

  // David paid $42.50 for Charlie -> Charlie owes David $42.50 more.
  await selectUser(page, "Paid by", "David");
  await selectUser(page, "Expense for", "Charlie");
  await dialog.getByLabel("Amount (USD)").fill("42.50");
  await dialog.getByLabel("Description").fill(description);
  await expect(dialog).toContainText("Charlie will owe David $42.50.");

  await dialog.getByRole("button", { name: "Add Expense" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText("Expense added")).toBeVisible();

  const newExpense = visibleExpenseRows(page).filter({ hasText: description });
  await expect(newExpense).toContainText(/David.*Charlie/); // payer first, then recipient
  await expect(newExpense).toContainText("$42.50");

  await showView(page, "Balances");
  const balances = page.getByRole("list", { name: "Balances" });

  const owedAfter = owedBefore + 4250;
  if (owedAfter > 0) {
    await expect(balances.getByRole("listitem").filter({ hasText: "Charlie owes David" })).toContainText(
      usd(owedAfter),
    );
  } else if (owedAfter < 0) {
    await expect(balances.getByRole("listitem").filter({ hasText: "David owes Charlie" })).toContainText(
      usd(-owedAfter),
    );
  } else {
    await expect(balances.getByText(/(Charlie owes David|David owes Charlie)/)).toHaveCount(0);
  }
});

test("shows validation errors and keeps the modal open for invalid input", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add Expense" }).click();
  const dialog = page.getByRole("dialog", { name: "Add Expense" });

  await dialog.getByRole("button", { name: "Add Expense" }).click();
  await expect(dialog.getByText("Select who paid")).toBeVisible();
  await expect(dialog.getByText("Select who it was for")).toBeVisible();
  await expect(dialog.getByText("Amount is required")).toBeVisible();
  await expect(dialog.getByText("Description is required")).toBeVisible();

  await selectUser(page, "Paid by", "Alice");
  await selectUser(page, "Expense for", "Alice");
  await dialog.getByLabel("Amount (USD)").fill("0");
  await dialog.getByLabel("Description").fill("Invalid");
  await dialog.getByRole("button", { name: "Add Expense" }).click();

  await expect(dialog.getByText("Payer and recipient must be different people")).toBeVisible();
  await expect(dialog.getByText("Amount must be greater than zero")).toBeVisible();
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
});
