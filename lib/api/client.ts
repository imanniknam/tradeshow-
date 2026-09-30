import type { ApiErrorBody, BalanceDto, ExpenseDto, UserDto } from "@/lib/types";
import type { CreateExpenseInput } from "@/lib/validations/expense";

/** Error thrown for failed API requests, with a user-facing message. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isApiErrorBody(body: unknown): body is ApiErrorBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as ApiErrorBody).error?.message === "string"
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0);
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (isApiErrorBody(body)) {
      throw new ApiError(body.error.message, response.status, body.error.fieldErrors);
    }
    throw new ApiError(`Request failed with status ${response.status}.`, response.status);
  }

  return (body as { data: T }).data;
}

export const api = {
  getUsers: () => request<UserDto[]>("/api/users"),
  getExpenses: () => request<ExpenseDto[]>("/api/expenses"),
  getBalances: () => request<BalanceDto[]>("/api/balances"),
  createExpense: (input: CreateExpenseInput) =>
    request<ExpenseDto>("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  deleteExpense: (id: number) => request<ExpenseDto>(`/api/expenses/${id}`, { method: "DELETE" }),
};

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
