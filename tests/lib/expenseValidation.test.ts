import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  createExpenseSchema,
  expenseFormSchema,
  toCreateExpenseInput,
  type ExpenseFormValues,
} from "@/lib/validations/expense";

const validForm: ExpenseFormValues = {
  paidById: "1",
  expenseForId: "2",
  amount: "12.50",
  description: "  Dinner  ",
};

function formErrors(values: Partial<ExpenseFormValues>) {
  const result = expenseFormSchema.safeParse({ ...validForm, ...values });
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe("expenseFormSchema", () => {
  it("accepts valid values and converts them to an API payload", () => {
    const parsed = expenseFormSchema.parse(validForm);
    expect(toCreateExpenseInput(parsed)).toEqual({
      paidById: 1,
      expenseForId: 2,
      amountCents: 1250,
      description: "Dinner",
    });
  });

  it("requires every field", () => {
    const errors = formErrors({ paidById: "", expenseForId: "", amount: "", description: "   " });
    expect(Object.keys(errors).sort()).toEqual(["amount", "description", "expenseForId", "paidById"]);
  });

  it.each(["0", "0.00", "-10", "abc", "1.999"])("rejects amount %j", (amount) => {
    expect(formErrors({ amount }).amount).toBeDefined();
  });

  it("rejects the same user as payer and recipient", () => {
    expect(formErrors({ expenseForId: "1" }).expenseForId).toEqual(["Payer and recipient must be different people"]);
  });
});

describe("createExpenseSchema", () => {
  const validPayload = { paidById: 1, expenseForId: 2, amountCents: 1250, description: "Dinner" };

  it("accepts a valid payload", () => {
    expect(createExpenseSchema.safeParse(validPayload).success).toBe(true);
  });

  it.each([
    ["zero amount", { amountCents: 0 }],
    ["negative amount", { amountCents: -100 }],
    ["fractional cents", { amountCents: 12.5 }],
    ["amount as string", { amountCents: "1250" }],
    ["same user", { expenseForId: 1 }],
    ["missing description", { description: "" }],
    ["invalid user id", { paidById: "alice" }],
  ])("rejects %s", (_label, override) => {
    expect(createExpenseSchema.safeParse({ ...validPayload, ...override }).success).toBe(false);
  });
});
