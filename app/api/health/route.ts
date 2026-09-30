import { prisma } from "@/lib/prisma";
import { jsonData, jsonError } from "@/lib/server/responses";

/** Liveness + database check for the platform's health probe. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return jsonData({ status: "ok" });
  } catch (error) {
    console.error("[api] GET /api/health", error);
    return jsonError(503, "Database unavailable");
  }
}
