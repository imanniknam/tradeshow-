const shortDateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "full",
  timeStyle: "short",
});

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Compact, human date for lists: "Today", "Yesterday", "Sep 28" in the current
 * year, and "Sep 28, 2025" otherwise. Uses the viewer's local time zone.
 */
export function formatRelativeDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.getFullYear() === now.getFullYear() ? shortDateFormatter.format(date) : dateFormatter.format(date);
}

/** "Monday, September 28, 2026 at 3:45 PM" */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** "1 expense", "3 expenses" */
export function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
