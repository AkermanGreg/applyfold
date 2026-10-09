import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { parseServerEnv } = await import("./env");

describe("parseServerEnv", () => {
  it("treats every integration as optional", () => {
    expect(parseServerEnv({})).toEqual({ NODE_ENV: "development", AI_MONTHLY_BUDGET_USD: 40 });
  });

  it("ignores empty strings instead of failing validation", () => {
    expect(parseServerEnv({ DATABASE_URL: "" }).DATABASE_URL).toBeUndefined();
  });

  it("rejects a malformed DATABASE_URL", () => {
    expect(() => parseServerEnv({ DATABASE_URL: "not a url" })).toThrow();
  });

  it("keeps valid values", () => {
    const env = parseServerEnv({ DATABASE_URL: "postgres://u:p@host/db", NODE_ENV: "test" });
    expect(env).toMatchObject({ DATABASE_URL: "postgres://u:p@host/db", NODE_ENV: "test" });
  });
});
