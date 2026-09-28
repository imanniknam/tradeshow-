const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "full",
  timeStyle: "short",
});

/** "Sep 28, 2026" */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

/** "Monday, September 28, 2026 at 3:45 PM" */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}
