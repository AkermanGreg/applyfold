import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { isPrivateAddress } = await import("./safe-fetch");

describe("isPrivateAddress", () => {
  it.each(["10.0.0.5", "127.0.0.1", "169.254.169.254", "172.20.1.1", "192.168.0.1", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "::ffff:127.0.0.1"])(
    "%s is private",
    (address) => expect(isPrivateAddress(address)).toBe(true),
  );

  it.each(["8.8.8.8", "172.32.0.1", "104.16.0.1", "2606:4700::1111"])("%s is public", (address) =>
    expect(isPrivateAddress(address)).toBe(false),
  );
});
