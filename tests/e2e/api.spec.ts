import { expect, test } from "@playwright/test";

// The API is shared by both device projects; run it once.
test.skip(({ isMobile }) => isMobile, "API checks are device independent.");

test("rejects invalid payloads with 400/422 and field errors", async ({ request }) => {
  const malformed = await request.post("/api/expenses", {
    headers: { "Content-Type": "application/json" },
    data: Buffer.from("{not json"),
  });
  expect(malformed.status()).toBe(400);

  const invalid = await request.post("/api/expenses", {
    data: { paidById: 1, expenseForId: 1, amountCents: 10.5, description: "  " },
  });
  expect(invalid.status()).toBe(422);
  const { error } = await invalid.json();
  expect(Object.keys(error.fieldErrors).sort()).toEqual(["amountCents", "description", "expenseForId"]);

  const unknownUser = await request.post("/api/expenses", {
    data: { paidById: 1, expenseForId: 999_999, amountCents: 100, description: "Ghost" },
  });
  expect(unknownUser.status()).toBe(422);
  expect((await unknownUser.json()).error.fieldErrors).toEqual({ expenseForId: ["User does not exist"] });
});

test("reports health", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ data: { status: "ok" } });
});
