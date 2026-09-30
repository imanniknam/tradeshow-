import { z } from "zod";

import { formatCents, MAX_AMOUNT_CENTS, parseAmountToCents } from "@/lib/money";

export const DESCRIPTION_MAX_LENGTH = 120;

const SAME_USER_MESSAGE = "Payer and recipient must be different people";
const AMOUNT_TOO_LARGE_MESSAGE = `Amount cannot exceed ${formatCents(MAX_AMOUNT_CENTS)}`;

const descriptionSchema = z
  .string({ error: "Description is required" })
  .trim()
  .min(1, "Description is required")
  .max(DESCRIPTION_MAX_LENGTH, `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`);

const userIdSchema = (label: string) =>
  z.number({ error: `${label} must be a user id` }).int(`${label} must be a user id`).positive(`${label} must be a user id`);

/** True when both user fields of a (possibly invalid) payload pass `isValidId`. */
function bothUsersPresent(value: unknown, isValidId: (id: unknown) => boolean): boolean {
  if (typeof value !== "object" || value === null) return false;
  const { paidById, expenseForId } = value as Record<string, unknown>;
  return isValidId(paidById) && isValidId(expenseForId);
}

/** Payload accepted by `POST /api/expenses`. */
export const createExpenseSchema = z
  .object({
    paidById: userIdSchema("paidById"),
    expenseForId: userIdSchema("expenseForId"),
    amountCents: z
      .number({ error: "amountCents must be a number" })
      // A refinement rather than `.int()`, which would abort the object and hide the same-user error.
      .refine(Number.isInteger, "amountCents must be a whole number of cents")
      .positive("Amount must be greater than zero")
      .max(MAX_AMOUNT_CENTS, AMOUNT_TOO_LARGE_MESSAGE),
    description: descriptionSchema,
  })
  .refine((data) => data.paidById !== data.expenseForId, {
    message: SAME_USER_MESSAGE,
    path: ["expenseForId"],
    // Check this even when other fields (amount, description) are invalid, so all errors are reported at once.
    when: ({ value }) => bothUsersPresent(value, (id) => Number.isInteger(id)),
  });

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

/** Values of the Add Expense form. Selects and inputs produce strings. */
export const expenseFormSchema = z
  .object({
    paidById: z.string().min(1, "Select who paid"),
    expenseForId: z.string().min(1, "Select who it was for"),
    amount: z
      .string()
      .trim()
      .min(1, "Amount is required")
      .superRefine((value, ctx) => {
        const cents = parseAmountToCents(value);
        if (cents === null) {
          ctx.addIssue({ code: "custom", message: "Enter a positive amount with up to 2 decimal places" });
        } else if (cents === 0) {
          ctx.addIssue({ code: "custom", message: "Amount must be greater than zero" });
        } else if (cents > MAX_AMOUNT_CENTS) {
          ctx.addIssue({ code: "custom", message: AMOUNT_TOO_LARGE_MESSAGE });
        }
      }),
    description: descriptionSchema,
  })
  .refine((data) => data.paidById !== data.expenseForId, {
    message: SAME_USER_MESSAGE,
    path: ["expenseForId"],
    when: ({ value }) => bothUsersPresent(value, (id) => typeof id === "string" && id.length > 0),
  });

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const emptyExpenseForm: ExpenseFormValues = {
  paidById: "",
  expenseForId: "",
  amount: "",
  description: "",
};

/** Converts validated form values into the API payload. */
export function toCreateExpenseInput(values: ExpenseFormValues): CreateExpenseInput {
  const amountCents = parseAmountToCents(values.amount);
  if (amountCents === null) {
    throw new Error("Amount must be validated before conversion");
  }
  return {
    paidById: Number(values.paidById),
    expenseForId: Number(values.expenseForId),
    amountCents,
    description: values.description.trim(),
  };
}
