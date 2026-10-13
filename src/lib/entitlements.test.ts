import { describe, expect, it } from "vitest";

import { entitlementFor, parseOwnerEmails } from "./entitlements";

const owners = parseOwnerEmails(" Owner@Example.com , staff@example.com,");
const now = new Date("2026-10-12T00:00:00Z");

describe("entitlementFor", () => {
  it("gives owners unlimited access regardless of plan or case", () => {
    expect(entitlementFor({ email: "owner@example.COM", plan: "free", planExpiresAt: null }, owners, now)).toEqual({
      plan: "autopilot",
      label: "Owner",
      unlimited: true,
    });
  });

  it("uses the paid plan while it's active and drops to free once it lapses", () => {
    const active = new Date("2026-11-01T00:00:00Z");
    const lapsed = new Date("2026-10-01T00:00:00Z");
    expect(entitlementFor({ email: "a@b.co", plan: "pro", planExpiresAt: active }, owners, now)).toMatchObject({ plan: "pro", unlimited: false });
    expect(entitlementFor({ email: "a@b.co", plan: "pro", planExpiresAt: lapsed }, owners, now)).toMatchObject({ plan: "free", label: "Free" });
  });

  it("never treats an empty email as an owner", () => {
    expect(entitlementFor({ email: "", plan: "free", planExpiresAt: null }, parseOwnerEmails(""), now).unlimited).toBe(false);
  });
});
