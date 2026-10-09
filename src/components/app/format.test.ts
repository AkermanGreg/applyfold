import { describe, expect, it } from "vitest";

import { formatPosted, formatSalary } from "./format";

describe("formatSalary", () => {
  it("formats ranges and single values", () => {
    expect(formatSalary(70000, 90000, "USD")).toBe("$70k–$90k");
    expect(formatSalary(32000, null, "GBP")).toBe("£32k");
    expect(formatSalary(null, null, "USD")).toBeNull();
    expect(formatSalary(25, 25, "USD")).toBe("$25");
  });
});

describe("formatPosted", () => {
  const now = new Date("2026-10-08T12:00:00Z").getTime();
  it("reads naturally", () => {
    expect(formatPosted("2026-10-08T08:00:00Z", now)).toBe("Today");
    expect(formatPosted("2026-10-07T08:00:00Z", now)).toBe("Yesterday");
    expect(formatPosted("2026-09-28T08:00:00Z", now)).toBe("10 days ago");
    expect(formatPosted(null, now)).toBeNull();
  });
});
