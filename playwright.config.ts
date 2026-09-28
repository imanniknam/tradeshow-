import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

/**
 * E2E tests run against a production build backed by a separate SQLite
 * database (prisma/e2e.db). Migrations and the idempotent seed are applied
 * before every run; tests derive expectations from the API, so they do not
 * depend on the database being empty.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `pnpm prisma migrate deploy && pnpm prisma db seed && pnpm build && pnpm start --port ${PORT}`,
    url: `${baseURL}/api/users`,
    env: { DATABASE_URL: "file:./prisma/e2e.db" },
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: "pipe",
  },
});
