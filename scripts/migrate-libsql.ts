/**
 * Applies the committed Prisma migrations (prisma/migrations/<name>/migration.sql)
 * to a libSQL / Turso database.
 *
 * `prisma migrate deploy` only supports `file:` URLs for SQLite, so hosted
 * SQLite (used on Vercel) is migrated with this script instead. Applied
 * migrations are recorded in `_libsql_migrations`, so it is safe to run on
 * every deploy.
 *
 *   DATABASE_URL=libsql://<db>.turso.io DATABASE_AUTH_TOKEN=... tsx scripts/migrate-libsql.ts
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";

const MIGRATIONS_DIR = path.join(process.cwd(), "prisma", "migrations");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url || (process.env.VERCEL && url.startsWith("file:"))) {
    throw new Error(
      [
        url ? `DATABASE_URL points at a local SQLite file (${url}), which Vercel cannot persist.` : "DATABASE_URL is not set.",
        "Set these in Vercel → Project Settings → Environment Variables (Production and Preview), then redeploy:",
        "  DATABASE_URL        = libsql://<database>-<org>.turso.io",
        "  DATABASE_AUTH_TOKEN = <token from `turso db tokens create <database>`>",
      ].join("\n"),
    );
  }

  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  try {
    await client.execute(
      "CREATE TABLE IF NOT EXISTS _libsql_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
    );
    const applied = new Set(
      (await client.execute("SELECT name FROM _libsql_migrations")).rows.map((row) => String(row.name)),
    );

    const entries = await readdir(MIGRATIONS_DIR, { withFileTypes: true });
    const pending = entries
      .filter((entry) => entry.isDirectory() && !applied.has(entry.name))
      .map((entry) => entry.name)
      .sort();

    for (const name of pending) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, name, "migration.sql"), "utf8");
      await client.executeMultiple(sql);
      await client.execute({
        sql: "INSERT INTO _libsql_migrations (name, applied_at) VALUES (?, ?)",
        args: [name, new Date().toISOString()],
      });
      console.log(`Applied migration ${name}`);
    }

    console.log(pending.length ? `${pending.length} migration(s) applied.` : "Database is up to date.");
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
