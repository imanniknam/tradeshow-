import { createExpense, listExpenses } from "@/lib/server/expenses";
import { jsonData, jsonError, jsonUnexpectedError, jsonValidationError } from "@/lib/server/responses";
import { findMissingUserIds } from "@/lib/server/users";
import { createExpenseSchema } from "@/lib/validations/expense";

export async function GET() {
  try {
    return jsonData(await listExpenses());
  } catch (error) {
    return jsonUnexpectedError(error, "GET /api/expenses");
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Request body must be valid JSON");
  }

  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return jsonValidationError(parsed.error);
  }

  try {
    const { paidById, expenseForId } = parsed.data;
    const missingIds = await findMissingUserIds([paidById, expenseForId]);
    if (missingIds.length > 0) {
      const fieldErrors: Record<string, string[]> = {};
      if (missingIds.includes(paidById)) fieldErrors.paidById = ["User does not exist"];
      if (missingIds.includes(expenseForId)) fieldErrors.expenseForId = ["User does not exist"];
      return jsonError(422, "One or more users do not exist", fieldErrors);
    }

    return jsonData(await createExpense(parsed.data), { status: 201 });
  } catch (error) {
    return jsonUnexpectedError(error, "POST /api/expenses");
  }
}
