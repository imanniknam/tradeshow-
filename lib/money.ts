/**
 * Money helpers. All amounts are handled as integer cents; conversion to and
 * from human-readable strings happens only at the edges (form input, display).
 */

export const CURRENCY = "USD";

/** Upper bound for a single expense: $1,000,000.00. */
export const MAX_AMOUNT_CENTS = 100_000_000;

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
});

/**
 * Parses a user-entered decimal string (e.g. "12.5", "1,250.00") into integer
 * cents without going through floating-point arithmetic.
 * Returns `null` when the input is not a valid non-negative amount with at
 * most two decimal places.
 */
export function parseAmountToCents(input: string): number | null {
  const normalized = input.trim().replace(/,/g, "");
  if (!AMOUNT_PATTERN.test(normalized)) {
    return null;
  }

  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

/** Formats integer cents as a currency string, e.g. 1250 -> "$12.50". */
export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}
