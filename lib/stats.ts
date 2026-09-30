const DAY_MS = 24 * 60 * 60 * 1000;

export function sumCents(items: readonly { amountCents: number }[]): number {
  return items.reduce((sum, item) => sum + item.amountCents, 0);
}

/** Items created within the last `days` days. */
export function filterRecent<T extends { createdAt: string }>(items: readonly T[], days: number, now = Date.now()): T[] {
  const since = now - days * DAY_MS;
  return items.filter((item) => Date.parse(item.createdAt) >= since);
}
