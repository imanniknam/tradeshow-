import { expect, test } from "@playwright/test";

import { netOwedCents, visibleExpenseRows } from "./helpers";

test("deletes an expense after confirmation and restores the balance", async ({ page, request }) => {
  const description = `Delete me ${Date.now()}`;
  const owedBefore = await netOwedCents(request, "Bob", "David");

  // David paid $7.25 for Bob, created through the API so the test controls the data.
  const users = (await (await request.get("/api/users")).json()).data as { id: number; name: string }[];
  const idOf = (name: string) => users.find((user) => user.name === name)!.id;
  const created = await request.post("/api/expenses", {
    data: { paidById: idOf("David"), expenseForId: idOf("Bob"), amountCents: 725, description },
  });
  expect(created.status()).toBe(201);
  expect(await netOwedCents(request, "Bob", "David")).toBe(owedBefore + 725);

  await page.goto("/");
  const row = visibleExpenseRows(page).filter({ hasText: description });
  await expect(row).toBeVisible();

  // Cancelling keeps the expense.
  await row.getByRole("button", { name: `Delete expense: ${description}` }).click();
  let dialog = page.getByRole("dialog", { name: "Delete this expense?" });
  await expect(dialog).toContainText(description);
  await expect(dialog).toContainText("$7.25");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(row).toBeVisible();

  // Confirming deletes it and refreshes the list and balances.
  await row.getByRole("button", { name: `Delete expense: ${description}` }).click();
  dialog = page.getByRole("dialog", { name: "Delete this expense?" });
  await dialog.getByRole("button", { name: "Delete expense" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText("Expense deleted")).toBeVisible();
  await expect(visibleExpenseRows(page).filter({ hasText: description })).toHaveCount(0);
  expect(await netOwedCents(request, "Bob", "David")).toBe(owedBefore);
});

test.describe("DELETE /api/expenses/:id", () => {
  test.skip(({ isMobile }) => isMobile, "API checks are device independent.");

  test("returns the deleted expense, then 404; rejects invalid ids", async ({ request }) => {
    const created = await request.post("/api/expenses", {
      data: { paidById: 1, expenseForId: 2, amountCents: 100, description: `API delete ${Date.now()}` },
    });
    const { data: expense } = await created.json();

    const deleted = await request.delete(`/api/expenses/${expense.id}`);
    expect(deleted.status()).toBe(200);
    expect((await deleted.json()).data).toMatchObject({ id: expense.id, amountCents: 100 });

    const again = await request.delete(`/api/expenses/${expense.id}`);
    expect(again.status()).toBe(404);

    expect((await request.delete("/api/expenses/abc")).status()).toBe(400);
    expect((await request.delete("/api/expenses/0")).status()).toBe(400);
  });
});
