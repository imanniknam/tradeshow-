import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";

/**
 * Picks the SQLite driver from the connection string:
 * - `file:...`                 -> local SQLite file via better-sqlite3 (dev, Docker/Hamravesh)
 * - `libsql://` / `https://`   -> hosted SQLite on Turso (serverless platforms such as Vercel,
 *                                  whose filesystem is read-only and not persistent)
 *
 * Both speak the same SQLite dialect, so the schema and migrations are shared.
 */
export function createDriverAdapter(url = process.env.DATABASE_URL) {
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (url.startsWith("file:")) {
    return new PrismaBetterSqlite3({ url });
  }
  return new PrismaLibSql({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
}
