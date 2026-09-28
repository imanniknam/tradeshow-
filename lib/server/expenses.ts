import { prisma } from "@/lib/prisma";
import type { ExpenseDto } from "@/lib/types";
import type { CreateExpenseInput } from "@/lib/validations/expense";

const userSelect = { select: { id: true, name: true } } as const;

const expenseSelect = {
  id: true,
  amountCents: true,
  description: true,
  createdAt: true,
  paidBy: userSelect,
  expenseFor: userSelect,
} as const;

type ExpenseRow = {
  id: number;
  amountCents: number;
  description: string;
  createdAt: Date;
  paidBy: { id: number; name: string };
  expenseFor: { id: number; name: string };
};

function toExpenseDto(expense: ExpenseRow): ExpenseDto {
  return { ...expense, createdAt: expense.createdAt.toISOString() };
}

export async function listExpenses(): Promise<ExpenseDto[]> {
  const expenses = await prisma.expense.findMany({
    select: expenseSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return expenses.map(toExpenseDto);
}

export async function createExpense(input: CreateExpenseInput): Promise<ExpenseDto> {
  const expense = await prisma.expense.create({ data: input, select: expenseSelect });
  return toExpenseDto(expense);
}
