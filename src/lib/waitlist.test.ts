import { describe, expect, it } from "vitest";

import { parseWaitlistForm } from "./waitlist";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("parseWaitlistForm", () => {
  it("normalizes email case and whitespace", () => {
    const result = parseWaitlistForm(form({ email: "  Maya.Patel@Example.COM ", website: "" }));
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("maya.patel@example.com");
  });

  it("accepts a known role and treats an empty role as unset", () => {
    expect(parseWaitlistForm(form({ email: "a@b.co", role: "Healthcare" })).data?.role).toBe(
      "Healthcare",
    );
    expect(parseWaitlistForm(form({ email: "a@b.co", role: "" })).data?.role).toBeUndefined();
  });

  it("rejects invalid emails and unknown roles", () => {
    expect(parseWaitlistForm(form({ email: "not-an-email" })).success).toBe(false);
    expect(parseWaitlistForm(form({ email: "a@b.co", role: "Astronaut" })).success).toBe(false);
  });

  it("flags the honeypot on the website field", () => {
    const result = parseWaitlistForm(form({ email: "a@b.co", website: "http://spam.example" }));
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path[0]).toBe("website");
  });
});
