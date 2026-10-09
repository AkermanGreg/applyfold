import { randomBytes } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { decryptWithKey, encryptWithKey, parseKey } = await import("./crypto");

describe("field encryption", () => {
  const key = randomBytes(32);

  it("round-trips unicode text", () => {
    const secret = "Maya Patel · BLS/ACLS · 4 años en UCI";
    expect(decryptWithKey(encryptWithKey(secret, key), key)).toBe(secret);
  });

  it("uses a fresh IV, so equal plaintexts encrypt differently", () => {
    expect(encryptWithKey("same", key)).not.toBe(encryptWithKey("same", key));
  });

  it("rejects tampered ciphertext", () => {
    const payload = encryptWithKey("authorized: yes", key);
    const body = Buffer.from(payload.slice(3), "base64");
    body[body.length - 1]! ^= 0xff;
    expect(() => decryptWithKey(`v1.${body.toString("base64")}`, key)).toThrow();
  });

  it("rejects the wrong key", () => {
    expect(() => decryptWithKey(encryptWithKey("x", key), randomBytes(32))).toThrow();
  });

  it("validates key length", () => {
    expect(() => parseKey(Buffer.alloc(16).toString("base64"))).toThrow(/32 bytes/);
    expect(parseKey(key.toString("base64"))).toHaveLength(32);
  });
});
