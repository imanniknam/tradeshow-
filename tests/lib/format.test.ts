import { describe, expect, it } from "vitest";

import { formatRelativeDate, pluralize } from "@/lib/format";

describe("formatRelativeDate", () => {
  const now = new Date(2026, 8, 30, 10, 0); // Sep 30, 2026 10:00 local time

  it("uses Today and Yesterday by calendar day, not by 24h windows", () => {
    expect(formatRelativeDate(new Date(2026, 8, 30, 0, 5).toISOString(), now)).toBe("Today");
    expect(formatRelativeDate(new Date(2026, 8, 29, 23, 59).toISOString(), now)).toBe("Yesterday");
  });

  it("omits the year for dates in the current year only", () => {
    expect(formatRelativeDate(new Date(2026, 8, 24, 12).toISOString(), now)).toBe("Sep 24");
    expect(formatRelativeDate(new Date(2025, 11, 31, 12).toISOString(), now)).toBe("Dec 31, 2025");
  });
});

describe("pluralize", () => {
  it("adds an s for anything but one", () => {
    expect(pluralize(0, "expense")).toBe("0 expenses");
    expect(pluralize(1, "expense")).toBe("1 expense");
    expect(pluralize(4, "balance")).toBe("4 balances");
  });
});
