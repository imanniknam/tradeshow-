import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../lib/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

const USER_NAMES = ["Alice", "Bob", "Charlie", "David"] as const;
type UserName = (typeof USER_NAMES)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

// paidBy -> expenseFor: `expenseFor` owes `paidBy` the amount.
const SAMPLE_EXPENSES: Array<{
  paidBy: UserName;
  expenseFor: UserName;
  amountCents: number;
  description: string;
  daysAgo: number;
}> = [
  { paidBy: "Alice", expenseFor: "Bob", amountCents: 12000, description: "Concert tickets", daysAgo: 6 },
  { paidBy: "Bob", expenseFor: "Alice", amountCents: 4000, description: "Lunch at the market", daysAgo: 5 },
  { paidBy: "Alice", expenseFor: "Charlie", amountCents: 5000, description: "Groceries", daysAgo: 4 },
  { paidBy: "Bob", expenseFor: "David", amountCents: 3000, description: "Taxi to the airport", daysAgo: 2 },
  { paidBy: "Charlie", expenseFor: "David", amountCents: 1850, description: "Coffee beans", daysAgo: 1 },
];

async function main() {
  const users = new Map<UserName, number>();
  for (const name of USER_NAMES) {
    const user = await prisma.user.upsert({ where: { name }, update: {}, create: { name } });
    users.set(name, user.id);
  }
  console.log(`Seeded ${users.size} users: ${USER_NAMES.join(", ")}`);

  // Only add sample expenses to an empty database so re-seeding is idempotent.
  if ((await prisma.expense.count()) > 0) {
    console.log("Expenses already exist, skipping sample expenses.");
    return;
  }

  const now = Date.now();
  await prisma.expense.createMany({
    data: SAMPLE_EXPENSES.map((expense) => ({
      paidById: users.get(expense.paidBy)!,
      expenseForId: users.get(expense.expenseFor)!,
      amountCents: expense.amountCents,
      description: expense.description,
      createdAt: new Date(now - expense.daysAgo * DAY_MS),
    })),
  });
  console.log(`Seeded ${SAMPLE_EXPENSES.length} sample expenses.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
