import { expect, test, type APIRequestContext } from "@playwright/test";

import {
  describeNet,
  netOwedCents,
  openAddExpense,
  selectUser,
  showView,
  usd,
  visibleExpenseRows,
} from "./helpers";

test("adds an expense and updates the expense list and balances", async ({ page, request }) => {
  const description = `Team lunch ${Date.now()}`;
  const owedBefore = await netOwedCents(request, "Charlie", "David");
  const owedAfter = owedBefore + 4250;

  await page.goto("/");
  await expect(visibleExpenseRows(page).first()).toBeVisible();

  const dialog = await openAddExpense(page);

  // David paid $42.50 for Charlie -> Charlie owes David $42.50 more (netted with any existing debt).
  await selectUser(page, "Paid by", "David");
  await selectUser(page, "Expense for", "Charlie");
  await dialog.getByLabel("Amount (USD)").fill("42.5");
  await dialog.getByLabel("Description").fill(description);

  const preview = dialog.getByTestId("balance-preview");
  await expect(preview).toContainText(previewLine("Now", describeNet("Charlie", "David", owedBefore)));
  await expect(preview).toContainText(previewLine("After", describeNet("Charlie", "David", owedAfter)));

  // Leaving the field tidies the amount.
  await expect(dialog.getByLabel("Amount (USD)")).toHaveValue("42.50");

  await dialog.getByRole("button", { name: "Save expense" }).click();

  await expect(dialog).toBeHidden();
  const toast = page.getByText("Expense added");
  await expect(toast).toBeVisible();

  const newExpense = visibleExpenseRows(page).filter({ hasText: description });
  await expect(newExpense).toContainText(/David.*Charlie/); // payer first, then recipient
  await expect(newExpense).toContainText("$42.50");

  await showView(page, "Balances");
  const balances = page.getByRole("list", { name: "Balances" });

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

test("nets an expense against an existing debt in the other direction", async ({ page, request }) => {
  // Make sure Bob owes Alice something, then have Bob pay for Alice more than that.
  const seedResponse = await request.post("/api/expenses", {
    data: {
      paidById: await userId(request, "Alice"),
      expenseForId: await userId(request, "Bob"),
      amountCents: 2500,
      description: "Setup",
    },
  });
  expect(seedResponse.status()).toBe(201);

  const bobOwesAlice = await netOwedCents(request, "Bob", "Alice");
  expect(bobOwesAlice).toBeGreaterThan(0);
  const paid = bobOwesAlice + 1000; // flips the debt: Alice ends up owing Bob $10.00

  await page.goto("/");
  const dialog = await openAddExpense(page);
  await selectUser(page, "Paid by", "Bob");
  await selectUser(page, "Expense for", "Alice");
  await dialog.getByLabel("Amount (USD)").fill((paid / 100).toFixed(2));
  await dialog.getByLabel("Description").fill("Paying Alice back, plus coffee");

  const preview = dialog.getByTestId("balance-preview");
  await expect(preview).toContainText(previewLine("Now", `Bob owes Alice ${usd(bobOwesAlice)}`));
  await expect(preview).toContainText(previewLine("After", "Alice owes Bob $10.00"));

  await dialog.getByRole("button", { name: "Save expense" }).click();
  await expect(page.getByText("Alice now owes Bob $10.00 in total.")).toBeVisible();
  expect(await netOwedCents(request, "Alice", "Bob")).toBe(1000);
});

test("shows validation errors and keeps the modal open for invalid input", async ({ page }) => {
  await page.goto("/");
  const dialog = await openAddExpense(page);

  await dialog.getByRole("button", { name: "Save expense" }).click();
  await expect(dialog.getByText("Select who paid")).toBeVisible();
  await expect(dialog.getByText("Select who it was for")).toBeVisible();
  await expect(dialog.getByText("Amount is required")).toBeVisible();
  await expect(dialog.getByText("Description is required")).toBeVisible();

  await selectUser(page, "Paid by", "Alice");
  await selectUser(page, "Expense for", "Alice");
  await dialog.getByLabel("Amount (USD)").fill("0");
  await dialog.getByLabel("Description").fill("Invalid");
  await dialog.getByRole("button", { name: "Save expense" }).click();

  await expect(dialog.getByText("Payer and recipient must be different people")).toBeVisible();
  await expect(dialog.getByText("Amount must be greater than zero")).toBeVisible();

  await dialog.getByLabel("Amount (USD)").fill("12.345");
  await expect(dialog.getByText("Enter a positive amount with up to 2 decimal places")).toBeVisible();
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
});

test("swaps payer and recipient", async ({ page, isMobile }) => {
  test.skip(isMobile, "The swap button is only shown when the fields sit side by side.");
  await page.goto("/");
  const dialog = await openAddExpense(page);

  await selectUser(page, "Paid by", "Alice");
  await selectUser(page, "Expense for", "Charlie");
  await dialog.getByRole("button", { name: "Swap payer and recipient" }).click();

  await expect(dialog.getByRole("combobox", { name: "Paid by" })).toContainText("Charlie");
  await expect(dialog.getByRole("combobox", { name: "Expense for" })).toContainText("Alice");
});

/** Matches a "Now …" / "After …" line of the balance preview. */
function previewLine(label: "Now" | "After", text: string) {
  return new RegExp(`${label}\\s*${text.replace(/[$.]/g, "\\$&")}`);
}

async function userId(request: APIRequestContext, name: string) {
  const response = await request.get("/api/users");
  const { data } = (await response.json()) as { data: { id: number; name: string }[] };
  const user = data.find((candidate) => candidate.name === name);
  if (!user) throw new Error(`Seed user ${name} not found`);
  return user.id;
}
