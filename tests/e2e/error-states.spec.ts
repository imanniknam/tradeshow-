import { expect, test } from "@playwright/test";

const serverError = {
  status: 500,
  json: { error: { message: "Something went wrong on our side. Please try again." } },
};

test("shows an error with retry when balances fail to load", async ({ page }) => {
  let failRequests = true;
  await page.route("**/api/balances", (route) => (failRequests ? route.fulfill(serverError) : route.fallback()));

  await page.goto("/");
  await expect(page.getByText("Couldn't load balances")).toBeVisible();
  await expect(page.getByText("Something went wrong on our side. Please try again.")).toBeVisible();
  // The expenses section is unaffected.
  await expect(page.getByRole("list", { name: "Expenses" })).toBeVisible();

  failRequests = false;
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("list", { name: "Balances" })).toBeVisible();
});

test("keeps the modal open and shows the server error when saving fails", async ({ page }) => {
  await page.route("**/api/expenses", (route) =>
    route.request().method() === "POST" ? route.fulfill(serverError) : route.fallback(),
  );

  await page.goto("/");
  await page.getByRole("button", { name: "Add Expense" }).click();
  const dialog = page.getByRole("dialog", { name: "Add expense" });

  await page.getByRole("combobox", { name: "Paid by" }).click();
  await page.getByRole("option", { name: "Alice", exact: true }).click();
  await page.getByRole("combobox", { name: "Expense for" }).click();
  await page.getByRole("option", { name: "Bob", exact: true }).click();
  await dialog.getByLabel("Amount (USD)").fill("10");
  await dialog.getByLabel("Description").fill("Should fail");
  await dialog.getByRole("button", { name: "Add expense" }).click();

  await expect(dialog.getByText("Couldn't save the expense")).toBeVisible();
  await expect(dialog.getByText("Something went wrong on our side. Please try again.")).toBeVisible();
  await expect(dialog.getByLabel("Description")).toHaveValue("Should fail");
});
