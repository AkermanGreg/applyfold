import { describe, expect, it } from "vitest";

import { annualSalary, dedupeKey, detectRemote, isFreshEnough, normalizeCompany, normalizeTitle, sanitizeSalary } from "./normalize";
import { htmlToText } from "./text";

describe("normalizeTitle", () => {
  it("expands abbreviations and drops noise words", () => {
    expect(normalizeTitle("Sr. RN - ICU (Remote, Full-time)")).toBe("senior registered nurse icu");
    expect(normalizeTitle("Asst. Store Mgr")).toBe("assistant store manager");
  });

  it("treats cosmetic variants as the same title", () => {
    expect(normalizeTitle("Registered Nurse – ICU")).toBe(normalizeTitle("registered nurse ICU"));
  });
});

describe("normalizeCompany", () => {
  it("strips legal suffixes and punctuation", () => {
    expect(normalizeCompany(" sweetgreen")).toBe("sweetgreen");
    expect(normalizeCompany("Acme Co., Inc.")).toBe("acme");
    expect(normalizeCompany("Riverside Health LLC")).toBe("riverside health");
  });
});

describe("dedupeKey", () => {
  it("collapses the same posting from two sources", () => {
    const a = dedupeKey({ company: "Riverside Health, Inc.", title: "Sr. RN - ICU", location: "Columbus, OH" });
    const b = dedupeKey({ company: "riverside health", title: "Senior Registered Nurse ICU", location: "Columbus OH" });
    expect(a).toBe(b);
  });

  it("keeps the same role in different cities apart", () => {
    const a = dedupeKey({ company: "sweetgreen", title: "Assistant Restaurant Manager", location: "Austin, TX" });
    const b = dedupeKey({ company: "sweetgreen", title: "Assistant Restaurant Manager", location: "Denver, CO" });
    expect(a).not.toBe(b);
  });
});

describe("detectRemote", () => {
  it("reads explicit flags and free-text hints", () => {
    expect(detectRemote(true)).toBe("remote");
    expect(detectRemote("Remote - US")).toBe("remote");
    expect(detectRemote("Hybrid (3 days in office)")).toBe("hybrid");
    expect(detectRemote("On-site, Columbus OH")).toBe("onsite");
    expect(detectRemote("Columbus, OH")).toBe("unknown");
  });
});

describe("isFreshEnough", () => {
  const now = new Date("2026-10-08T00:00:00Z");
  it("applies the cutoff and passes undated jobs", () => {
    expect(isFreshEnough(new Date("2026-10-01T00:00:00Z"), 30, now)).toBe(true);
    expect(isFreshEnough(new Date("2026-08-01T00:00:00Z"), 30, now)).toBe(false);
    expect(isFreshEnough(null, 30, now)).toBe(true);
  });
});

describe("htmlToText", () => {
  it("decodes double-escaped Greenhouse HTML into readable text", () => {
    const html = "&lt;h3&gt;&lt;strong&gt;About&lt;/strong&gt;&lt;/h3&gt;&lt;p&gt;Care &amp;amp; compassion&lt;/p&gt;&lt;ul&gt;&lt;li&gt;BLS&lt;/li&gt;&lt;li&gt;ACLS&lt;/li&gt;&lt;/ul&gt;";
    expect(htmlToText(html)).toBe("About\n\nCare & compassion\n\n• BLS\n• ACLS");
  });

  it("drops scripts and truncates very long text", () => {
    expect(htmlToText("<p>Hi</p><script>alert(1)</script>")).toBe("Hi");
    expect(htmlToText(`<p>${"a".repeat(50)}</p>`, 10)).toBe(`${"a".repeat(10)}…`);
  });
});

describe("salary normalization", () => {
  it("annualizes hourly, monthly and yearly figures from any source's interval names", () => {
    expect(annualSalary(22.69, "per-hour-wage")).toBe(47195);
    expect(annualSalary(25, "1 HOUR")).toBe(52000);
    expect(annualSalary(1700, "per-month-salary")).toBe(20400);
    expect(annualSalary(85000, "per-year-salary")).toBe(85000);
    expect(annualSalary(85000, null)).toBe(85000);
  });

  it("refuses one-off or nonsense figures", () => {
    expect(annualSalary(5000, "one-time")).toBeNull();
    expect(annualSalary(0, "1 YEAR")).toBeNull();
    expect(sanitizeSalary(4.5)).toBe(5);
    expect(sanitizeSalary(99_999_999_999)).toBeNull();
    expect(sanitizeSalary(Number.NaN)).toBeNull();
  });
});
