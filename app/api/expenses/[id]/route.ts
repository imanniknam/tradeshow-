import { z } from "zod";

import { deleteExpense } from "@/lib/server/expenses";
import { jsonData, jsonError, jsonUnexpectedError } from "@/lib/server/responses";

const expenseIdSchema = z.coerce.number().int().positive();

export async function DELETE(_request: Request, ctx: RouteContext<"/api/expenses/[id]">) {
  const { id: rawId } = await ctx.params;
  const parsed = expenseIdSchema.safeParse(rawId);
  if (!parsed.success) {
    return jsonError(400, "Expense id must be a positive integer");
  }

  try {
    const deleted = await deleteExpense(parsed.data);
    if (!deleted) {
      return jsonError(404, "Expense not found. It may have already been deleted.");
    }
    return jsonData(deleted);
  } catch (error) {
    return jsonUnexpectedError(error, `DELETE /api/expenses/${parsed.data}`);
  }
}
