import { defineConfig, env } from "prisma/config";

// Prisma 7 no longer loads `.env` automatically. In containers the variables
// come from the environment, so a missing file is fine.
try {
  process.loadEnvFile();
} catch {
  // no .env file present
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
