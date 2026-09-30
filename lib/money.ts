/**
 * Money helpers. All amounts are handled as integer cents; conversion to and
 * from human-readable strings happens only at the edges (form input, display).
 */

export const CURRENCY = "USD";

/** Upper bound for a single expense: $1,000,000.00. */
export const MAX_AMOUNT_CENTS = 100_000_000;

/**
 * Plain digits ("1250") or correctly grouped thousands ("1,250"), optionally
 * followed by up to two decimals. A bare leading or trailing dot is allowed
 * (".5", "12."), since that is how people type amounts on phones.
 */
const AMOUNT_PATTERN = /^(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d{0,2})?$/;

/** Persian (U+06F0–U+06F9) and Arabic-Indic (U+0660–U+0669) digits. */
const NON_LATIN_DIGITS = /[۰-۹٠-٩]/g;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
});

const plainFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Maps Persian/Arabic digits and separators to their ASCII equivalents, so
 * amounts typed on a Persian keyboard parse like any other.
 */
function normalizeDigits(input: string): string {
  return input
    .replace(NON_LATIN_DIGITS, (digit) => String(digit.charCodeAt(0) & 0xf))
    .replace(/[٫]/g, ".") // Arabic decimal separator
    .replace(/[٬،]/g, ","); // Arabic thousands separator, Arabic comma
}

/**
 * Parses a user-entered decimal string (e.g. "12.5", "1,250.00") into integer
 * cents without going through floating-point arithmetic.
 * Returns `null` when the input is not a valid non-negative amount with at
 * most two decimal places.
 */
export function parseAmountToCents(input: string): number | null {
  const normalized = normalizeDigits(input.trim());
  if (!/\d/.test(normalized) || !AMOUNT_PATTERN.test(normalized)) {
    return null;
  }

  const [whole = "", fraction = ""] = normalized.replace(/,/g, "").split(".");
  const cents = Number(whole || "0") * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

/** Formats integer cents as a currency string, e.g. 1250 -> "$12.50". */
export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/** Formats integer cents for an input field, without the currency sign: 125000 -> "1,250.00". */
export function formatCentsForInput(cents: number): string {
  return plainFormatter.format(cents / 100);
}
