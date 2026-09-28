# SplitLite — Expense Sharing

A small full-stack expense-sharing app inspired by Splitwise. Seeded users record
**directional expenses** between each other and see their **net balances**.

```
Alice → Bob → $50     means     Bob owes Alice $50
```

> **Live demo:** _add the public Hamravesh URL here after deploying_

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Database schema](#database-schema)
5. [API](#api)
6. [Balance calculation](#balance-calculation)
7. [Local setup](#local-setup)
8. [Environment variables](#environment-variables)
9. [Database: migrations & seed](#database-migrations--seed)
10. [Scripts](#scripts)
11. [Testing](#testing)
12. [Production build](#production-build)
13. [Deployment (Hamravesh)](#deployment-hamravesh)
14. [Design decisions & trade-offs](#design-decisions--trade-offs)

---

## Features

- **Expenses view:** every expense, showing who paid, who it was for, the amount, the description and the date (newest first).
- **Balances view:** net balance per pair of users, e.g. `Bob owes Alice $120`.
  Transactions in both directions are netted, and pairs that net to zero are hidden.
- **Add Expense modal:**
  - Fields: _Paid by_, _Expense for_, _Amount_ and _Description_.
  - Client-side and server-side validation, with a live "Bob will owe Alice $50.00" preview.
  - Both lists refresh automatically after an expense is saved.
- **Seeded users:** Alice, Bob, Charlie and David, loaded from the database. There is no auth, registration or user-management UI, by design.
- **Money stored as integer cents** end to end. Values are formatted as USD only for display.
- **Polished UX:** loading skeletons, empty states, error states with retry, toast feedback, accessible labelled form controls, and a responsive layout (two columns on desktop, stacked on mobile).

## Tech stack

| Concern             | Choice                                                     |
| ------------------- | ---------------------------------------------------------- |
| Framework           | Next.js 16 (App Router), React 19, TypeScript              |
| Backend             | Next.js Route Handlers (`app/api/*`), no separate server   |
| Database            | SQLite via Prisma ORM 7 (`@prisma/adapter-better-sqlite3`) |
| Validation          | Zod 4, shared by client and server                         |
| Forms               | React Hook Form + `@hookform/resolvers`                    |
| Server state        | TanStack Query 5                                           |
| UI                  | Tailwind CSS 4, shadcn/ui (Radix), lucide icons, sonner    |
| Unit tests          | Vitest                                                     |
| E2E tests           | Playwright                                                 |
| Package manager     | pnpm                                                       |

## Architecture

A single Next.js application. The browser only talks to the REST API; Prisma is
used exclusively on the server inside route handlers.

```
Browser (React + TanStack Query)
        │  fetch /api/*
        ▼
Route Handlers (app/api/**/route.ts)  ── Zod validation, JSON responses
        │
        ▼
lib/server/*  ── small query functions (Prisma)
lib/balance/calculateBalances.ts  ── pure business logic, unit tested
        │
        ▼
SQLite (Prisma + better-sqlite3 driver adapter)
```

```
app/
├── api/
│   ├── users/route.ts         GET  /api/users
│   ├── expenses/route.ts      GET/POST /api/expenses
│   └── balances/route.ts      GET  /api/balances
├── layout.tsx                 fonts, metadata, providers
├── page.tsx                   the single page
└── providers.tsx              QueryClientProvider + toaster
components/
├── expenses/
│   ├── ExpenseList.tsx
│   └── AddExpenseModal.tsx
├── balances/
│   └── BalanceList.tsx
├── shared/QueryError.tsx      error state with retry
├── users/UserAvatar.tsx
└── ui/                        shadcn/ui primitives
lib/
├── api/
│   ├── client.ts              typed fetch client + ApiError
│   └── queries.ts             TanStack Query hooks and query keys
├── balance/
│   └── calculateBalances.ts   balance netting algorithm (pure)
├── server/                    server-only data access + response helpers
├── validations/expense.ts     Zod schemas (API payload + form)
├── money.ts                   cents parsing/formatting
├── format.ts                  date formatting
├── prisma.ts                  Prisma client singleton
└── types.ts                   DTOs shared by API and client
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
tests/
├── balance/                   Vitest: balance algorithm
├── lib/                       Vitest: money + validation
└── e2e/                       Playwright
```

**Key principles**

- Business logic (balance netting, money parsing, validation) is framework-free and unit tested. None of it lives in React components.
- Route handlers stay thin: parse, validate, call a query function, return JSON.
- No repositories, services or DI containers. There are just a few functions, which is enough for this scope.

## Database schema

```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  createdAt DateTime @default(now())

  paidExpenses Expense[] @relation("PaidBy")
  owedExpenses Expense[] @relation("ExpenseFor")
}

model Expense {
  id           Int      @id @default(autoincrement())
  paidById     Int
  expenseForId Int
  amountCents  Int      // $12.50 is stored as 1250
  description  String
  createdAt    DateTime @default(now())

  paidBy     User @relation("PaidBy",     fields: [paidById],     references: [id], onDelete: Restrict)
  expenseFor User @relation("ExpenseFor", fields: [expenseForId], references: [id], onDelete: Restrict)

  @@index([paidById])
  @@index([expenseForId])
  @@index([createdAt])
}
```

- An `Expense` is a **single directional transaction**: `paidBy` paid `amountCents` on behalf of `expenseFor`, so `expenseFor` owes `paidBy`.
- The two named relations make the direction explicit. `onDelete: Restrict` prevents orphaned expenses.
- The amount is named `amountCents` so its unit is clear wherever it is used.
- Balances are **derived, not stored**, so they can never drift from the expense ledger.

## API

All responses are JSON. Successful responses are wrapped as `{ "data": ... }`. Errors
always look like:

```json
{ "error": { "message": "Invalid expense data", "fieldErrors": { "amountCents": ["Amount must be greater than zero"] } } }
```

| Method | Path             | Description                                   | Success |
| ------ | ---------------- | --------------------------------------------- | ------- |
| GET    | `/api/users`     | Seeded users, sorted by name                  | 200     |
| GET    | `/api/expenses`  | All expenses with payer/recipient, newest first | 200   |
| POST   | `/api/expenses`  | Create an expense                             | 201     |
| GET    | `/api/balances`  | Net balances between users                    | 200     |

**`POST /api/expenses`** request body:

```json
{ "paidById": 1, "expenseForId": 2, "amountCents": 5000, "description": "Dinner" }
```

| Status | When                                                                   |
| ------ | ---------------------------------------------------------------------- |
| 201    | Created. Returns the new expense.                                      |
| 400    | Body is not valid JSON.                                                |
| 422    | Validation failed (missing fields, amount ≤ 0 or not whole cents, same payer and recipient, description too long) or a referenced user does not exist. |
| 500    | Unexpected server/database error. The details are logged server-side; the client gets a generic message. |

Unsupported methods return `405` (handled by Next.js).

Example responses:

```jsonc
// GET /api/expenses
{ "data": [{ "id": 1, "amountCents": 5000, "description": "Dinner", "createdAt": "2026-09-28T12:00:00.000Z",
             "paidBy": { "id": 1, "name": "Alice" }, "expenseFor": { "id": 2, "name": "Bob" } }] }

// GET /api/balances
{ "data": [{ "from": { "id": 2, "name": "Bob" }, "to": { "id": 1, "name": "Alice" }, "amountCents": 5000 }] }
```

## Balance calculation

Implemented in [`lib/balance/calculateBalances.ts`](lib/balance/calculateBalances.ts) as a pure function:

```ts
calculateBalances(transactions: { paidBy; expenseFor; amountCents }[]): { from; to; amountCents }[]
```

1. **Aggregate per unordered pair.** Each pair `{A, B}` gets one running total, keyed by `lowerId:higherId`.
2. **Net opposite directions.** An expense `P → F` means `F` owes `P`, so it is added to or subtracted from the pair's total depending on direction.
3. **Remove zero balances.** Pairs that net to exactly `0` are dropped.
4. **Produce directional results.** The sign of the total decides who owes whom, giving `{ from: debtor, to: creditor, amountCents }`.
5. Results are sorted by amount (largest first), then by name, so the output is deterministic.

All arithmetic is on **integer cents**, so there is no floating-point drift (e.g. ten `$0.10` expenses sum to exactly `$1.00`).
Invalid amounts (non-integer or ≤ 0) throw rather than silently corrupting totals.

In `GET /api/balances`, the database first aggregates with a `GROUP BY (paidById, expenseForId)`
`SUM(amountCents)`. Those per-direction totals are then passed through the same function, so the
work stays proportional to the number of user pairs rather than the number of expenses.

Examples (all covered by unit tests):

| Transactions                                         | Result                  |
| ---------------------------------------------------- | ----------------------- |
| Alice → Bob $50                                      | Bob owes Alice $50      |
| Alice → Bob $100, Bob → Alice $40                    | Bob owes Alice $60      |
| Alice → Bob $100, Alice → Bob $50, Bob → Alice $30   | Bob owes Alice $120     |
| Alice → Bob $50, Bob → Alice $50                     | _(no balance)_          |

## Local setup

**Prerequisites:** Node.js ≥ 20.19 (developed on Node 24) and pnpm ≥ 10 (`npm i -g pnpm`).

```bash
git clone <repo-url> splitlite
cd splitlite
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
pnpm install                  # also runs `prisma generate`
pnpm prisma migrate dev       # creates prisma/dev.db and applies migrations
pnpm prisma db seed           # seeds Alice, Bob, Charlie, David (+ sample expenses)
pnpm dev                      # http://localhost:3000
```

> pnpm 10+ only runs dependency build scripts that are explicitly allowed. The allow-list
> (`better-sqlite3`, `prisma`, `@prisma/engines`, `esbuild`) is already committed in
> `pnpm-workspace.yaml`, so no `pnpm approve-builds` step is needed.

## Environment variables

| Variable       | Required | Default in `.env.example` | Description |
| -------------- | -------- | ------------------------- | ----------- |
| `DATABASE_URL` | yes      | `file:./prisma/dev.db`    | SQLite connection string. Relative paths are resolved from the project root. In production use an absolute path on a persistent volume, e.g. `file:/app/data/app.db`. |

`.env` is git-ignored; only `.env.example` is committed. There are no secrets.

## Database: migrations & seed

```bash
pnpm prisma migrate dev          # create/apply migrations in development
pnpm prisma migrate deploy       # apply committed migrations (production/CI)
pnpm prisma db seed              # seed users (idempotent)
pnpm prisma studio               # browse the database
pnpm db:reset                    # drop, re-create and re-seed the dev database (destructive)
```

The seed script ([`prisma/seed.ts`](prisma/seed.ts)) **upserts** the four users. It only inserts
sample expenses into an **empty** database, so it is safe to run on every deploy.

## Scripts

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `pnpm dev`          | Start the dev server on port 3000               |
| `pnpm build`        | Production build                                |
| `pnpm start`        | Serve the production build                      |
| `pnpm typecheck`    | Generate route types and run `tsc --noEmit`     |
| `pnpm lint`         | ESLint (Next.js core-web-vitals + TypeScript)   |
| `pnpm test`         | Vitest unit tests                               |
| `pnpm test:watch`   | Vitest in watch mode                            |
| `pnpm test:e2e`     | Playwright end-to-end tests                     |
| `pnpm db:migrate`   | `prisma migrate dev`                            |
| `pnpm db:deploy`    | `prisma migrate deploy`                         |
| `pnpm db:seed`      | `prisma db seed`                                |
| `pnpm db:reset`     | `prisma migrate reset --force` (destructive, dev only) |

## Testing

```bash
pnpm test                               # unit tests
pnpm exec playwright install chromium   # once, downloads the browser
pnpm test:e2e                           # end-to-end tests
```

- **Unit tests (Vitest):**
  - [`tests/balance`](tests/balance) covers the balance algorithm: a single transaction, opposite transactions, multiple transactions, zero net balance, independent pairs, no transitive netting, cent precision, order independence and invalid amounts.
  - [`tests/lib`](tests/lib) covers money parsing and formatting, the form schema and the API schema.
- **E2E tests (Playwright):** [`tests/e2e`](tests/e2e) runs on desktop and mobile Chromium.
  - It opens the Add Expense modal, fills the form, submits, then checks that the new expense appears and the netted balance updates.
  - It also checks validation errors.
  - Playwright builds the app and starts it on port 3100 against a **separate** database (`prisma/e2e.db`), so your dev data is untouched.
  - Expected balances are computed from the API before the test, so the suite is repeatable.

## Production build

```bash
pnpm install --frozen-lockfile
pnpm prisma migrate deploy
pnpm prisma db seed
pnpm build
pnpm start          # PORT defaults to 3000
```

Or with Docker (the recommended way to deploy):

```bash
docker build -t splitlite .
docker run -p 3000:3000 -v splitlite-data:/app/data splitlite
```

On start the container runs `prisma migrate deploy` and the idempotent seed, then `next start`.
The SQLite file lives in `/app/data` (a volume).

## Deployment (Hamravesh)

The challenge requires a deployment reachable from Iran, so the app targets
[Hamravesh](https://hamravesh.com) (Darkube) rather than Vercel. The app is a single
stateless-code container plus one SQLite file on a persistent disk.

1. Push this repository to GitHub.
2. In the Hamravesh console, create a new app that **builds from a Git repository using the `Dockerfile`**, and connect the repo.
3. Configure the app:
   - **Port:** `3000`
   - **Environment:** `DATABASE_URL=file:/app/data/app.db`. This is already the image default, so setting it is optional.
   - **Persistent disk:** attach a small volume (e.g. 1 GB) mounted at **`/app/data`**. Without it, data is lost on redeploy.
   - **Replicas:** `1`. SQLite is a single-file database, so don't scale horizontally.
   - **Health check (optional):** HTTP `GET /api/users` should return 200.
4. Deploy. Migrations and the seed run automatically on start. Enable the free `*.darkube.app` domain (or attach your own) and HTTPS.

**If Docker Hub or npm is slow or blocked from the build servers**, the Dockerfile exposes build arguments so everything can be pulled through mirrors:

| Build arg      | Default                          | Example mirror value |
| -------------- | -------------------------------- | -------------------- |
| `NODE_IMAGE`   | `node:24-bookworm-slim`          | `hub.hamdocker.ir/library/node:24-bookworm-slim` (Hamravesh's Docker Hub mirror) |
| `NPM_REGISTRY` | `https://registry.npmjs.org/`    | any reachable npm mirror |

Prisma also downloads its migration engine during `pnpm install`. If `binaries.prisma.sh`
is unreachable, set the `PRISMA_ENGINES_MIRROR` environment variable for the build.

Any other container host reachable from Iran (e.g. Liara, Runflare, or a plain VPS with
`docker run`) works the same way: build the Dockerfile, expose port 3000, and mount a volume at `/app/data`.

## Design decisions & trade-offs

- **Integer cents everywhere.** The API accepts and returns `amountCents`. The form converts the typed decimal string to cents without floating-point maths, and formatting to `$` happens only in the UI.
- **Balances are computed on read.** For a small ledger this is simple and always consistent. With much more data, the SQL `GROUP BY` already keeps the work proportional to the number of user pairs. The next step would be caching or a materialised pair-balance table.
- **Pairwise netting only.** Balances are netted per pair, as the challenge specifies. Debts are not simplified across the whole group (e.g. A→B→C collapsed into A→C), because that would hide who actually transacted with whom.
- **422 for semantic errors** (validation, unknown users) and **400** only for malformed JSON.
- **SQLite on a volume.** This is ideal for the brief, but it limits the app to one replica. Moving to Postgres only requires changing the Prisma provider and adapter.
- **Local fonts** (`geist` package) instead of `next/font/google`, so production builds don't depend on reaching Google Fonts.
- **`prisma` and `tsx` are runtime dependencies** because the container applies migrations and runs the seed on start.
