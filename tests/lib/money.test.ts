import { describe, expect, it } from "vitest";

import { formatCents, formatCentsForInput, parseAmountToCents } from "@/lib/money";

describe("parseAmountToCents", () => {
  it.each([
    ["50", 5000],
    ["12.5", 1250],
    ["12.50", 1250],
    ["0.01", 1],
    ["0.1", 10],
    [" 7.25 ", 725],
    ["1,250.99", 125099],
    ["1,000,000", 100000000],
    [".5", 50],
    ["12.", 1200],
    ["0", 0],
    ["۱۲٫۵۰", 1250], // Persian digits and decimal separator
    ["١٠٠", 10000], // Arabic-Indic digits
  ])("parses %j as %i cents", (input, expected) => {
    expect(parseAmountToCents(input)).toBe(expected);
  });

  it.each(["", ".", "abc", "-5", "1.234", "1e3", "12.5.0", "$10", "1,2,3", "12,34", ",100"])(
    "rejects %j",
    (input) => {
      expect(parseAmountToCents(input)).toBeNull();
    },
  );
});

describe("formatCents", () => {
  it("formats cents as USD", () => {
    expect(formatCents(1250)).toBe("$12.50");
    expect(formatCents(1)).toBe("$0.01");
    expect(formatCents(12345678)).toBe("$123,456.78");
  });

  it("formats cents for an input field and round-trips", () => {
    expect(formatCentsForInput(125000)).toBe("1,250.00");
    expect(parseAmountToCents(formatCentsForInput(125099))).toBe(125099);
  });
});
