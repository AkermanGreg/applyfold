import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ currentUser: vi.fn() }));

const { monthlyLimit, usagePeriod } = await import("./usage");
const { effectivePlan } = await import("./users");

describe("plan limits", () => {
  it("follows the pricing table", () => {
    expect(monthlyLimit("free", "tailored_application")).toBe(5);
    expect(monthlyLimit("pro", "tailored_application")).toBe(100);
    expect(monthlyLimit("free", "auto_fill")).toBe(0);
    expect(monthlyLimit("pro", "auto_fill")).toBe(0);
    expect(monthlyLimit("autopilot", "auto_fill")).toBe(40);
  });

  it("caps resume parsing on every plan", () => {
    expect(monthlyLimit("autopilot", "resume_parse")).toBe(5);
  });

  it("buckets usage by UTC calendar month", () => {
    expect(usagePeriod(new Date("2026-10-31T23:59:59Z"))).toBe("2026-10");
    expect(usagePeriod(new Date("2026-11-01T00:00:00Z"))).toBe("2026-11");
  });
});

describe("effectivePlan", () => {
  const now = new Date("2026-10-08T00:00:00Z");
  it("drops lapsed paid plans to free", () => {
    expect(effectivePlan({ plan: "pro", planExpiresAt: new Date("2026-10-01T00:00:00Z") }, now)).toBe("free");
    expect(effectivePlan({ plan: "pro", planExpiresAt: new Date("2026-11-01T00:00:00Z") }, now)).toBe("pro");
    expect(effectivePlan({ plan: "autopilot", planExpiresAt: null }, now)).toBe("autopilot");
    expect(effectivePlan({ plan: "free", planExpiresAt: null }, now)).toBe("free");
  });
});
