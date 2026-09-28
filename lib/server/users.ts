import { prisma } from "@/lib/prisma";
import type { UserDto } from "@/lib/types";

export function listUsers(): Promise<UserDto[]> {
  return prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/** Returns the ids from `ids` that do not belong to an existing user. */
export async function findMissingUserIds(ids: number[]): Promise<number[]> {
  const existing = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((user) => user.id));
  return ids.filter((id) => !existingIds.has(id));
}
