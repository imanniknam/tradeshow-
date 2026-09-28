import { describe, expect, it } from "vitest";

import { formatCents, parseAmountToCents } from "@/lib/money";

describe("parseAmountToCents", () => {
  it.each([
    ["50", 5000],
    ["12.5", 1250],
    ["12.50", 1250],
    ["0.01", 1],
    ["0.1", 10],
    [" 7.25 ", 725],
    ["1,250.99", 125099],
    ["0", 0],
  ])("parses %j as %i cents", (input, expected) => {
    expect(parseAmountToCents(input)).toBe(expected);
  });

  it.each(["", "abc", "-5", "1.234", "1.", ".5", "1e3", "12.5.0", "$10"])("rejects %j", (input) => {
    expect(parseAmountToCents(input)).toBeNull();
  });
});

describe("formatCents", () => {
  it("formats cents as USD", () => {
    expect(formatCents(1250)).toBe("$12.50");
    expect(formatCents(1)).toBe("$0.01");
    expect(formatCents(12345678)).toBe("$123,456.78");
  });
});
