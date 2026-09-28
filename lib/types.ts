/** Data transfer objects shared by the API route handlers and the client. */

export interface UserDto {
  id: number;
  name: string;
}

export interface ExpenseDto {
  id: number;
  amountCents: number;
  description: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
  paidBy: UserDto;
  expenseFor: UserDto;
}

/** `from` owes `to` the given amount. */
export interface BalanceDto {
  from: UserDto;
  to: UserDto;
  amountCents: number;
}

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiErrorBody {
  error: {
    message: string;
    /** Field-level validation messages, keyed by field name. */
    fieldErrors?: Record<string, string[]>;
  };
}
