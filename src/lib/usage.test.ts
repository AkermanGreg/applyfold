import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { monthlyLimit, usagePeriod } = await import("./usage");

const plan = (id: "free" | "pro" | "autopilot") => ({ plan: id, label: id, unlimited: false });

describe("plan limits", () => {
  it("follows the pricing table", () => {
    expect(monthlyLimit(plan("free"), "tailored_application")).toBe(5);
    expect(monthlyLimit(plan("pro"), "tailored_application")).toBe(100);
    expect(monthlyLimit(plan("free"), "auto_fill")).toBe(0);
    expect(monthlyLimit(plan("pro"), "auto_fill")).toBe(0);
    expect(monthlyLimit(plan("autopilot"), "auto_fill")).toBe(40);
  });

  it("caps resume parsing on every paid plan", () => {
    expect(monthlyLimit(plan("autopilot"), "resume_parse")).toBe(5);
  });

  it("lifts every cap for unlimited (owner) accounts", () => {
    const owner = { plan: "autopilot" as const, label: "Owner", unlimited: true };
    expect(monthlyLimit(owner, "tailored_application")).toBe(Number.POSITIVE_INFINITY);
    expect(monthlyLimit(owner, "resume_parse")).toBe(Number.POSITIVE_INFINITY);
  });

  it("buckets usage by UTC calendar month", () => {
    expect(usagePeriod(new Date("2026-10-31T23:59:59Z"))).toBe("2026-10");
    expect(usagePeriod(new Date("2026-11-01T00:00:00Z"))).toBe("2026-11");
  });
});
