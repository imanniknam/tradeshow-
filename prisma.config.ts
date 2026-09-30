import { defineConfig } from "prisma/config";

// Prisma 7 no longer loads `.env` automatically. In containers the variables
// come from the environment, so a missing file is fine.
try {
  process.loadEnvFile();
} catch {
  // no .env file present
}

const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // `prisma generate` (run on install) needs no database, so the URL is only
  // required by commands that connect, e.g. `migrate`, which report it clearly.
  ...(url && { datasource: { url } }),
});
