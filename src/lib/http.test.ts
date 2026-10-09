import { beforeEach, describe, expect, it, vi } from "vitest";

import { CRAWLER_USER_AGENT, HttpError, politeFetchJson, redactUrl, resetHostThrottle } from "./http";

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers });

describe("politeFetchJson", () => {
  const sleep = vi.fn(async (_ms: number) => {});

  beforeEach(() => {
    resetHostThrottle();
    sleep.mockClear();
  });

  it("identifies the crawler with a user agent", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => json({ ok: true }));
    await politeFetchJson("https://boards-api.greenhouse.io/x", { fetchImpl, sleep });
    const init = fetchImpl.mock.calls[0]?.[1] ?? {};
    expect((init.headers as Record<string, string>)["User-Agent"]).toBe(CRAWLER_USER_AGENT);
  });

  it("retries 429 honoring Retry-After, then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({}, 429, { "retry-after": "2" }))
      .mockResolvedValueOnce(json({ jobs: [] }));
    await expect(politeFetchJson("https://a.example/x", { fetchImpl, sleep })).resolves.toEqual({ jobs: [] });
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it("does not retry a 404", async () => {
    const fetchImpl = vi.fn(async () => json({}, 404));
    await expect(politeFetchJson("https://a.example/x", { fetchImpl, sleep })).rejects.toBeInstanceOf(HttpError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("gives up after the retry budget on persistent 5xx", async () => {
    const fetchImpl = vi.fn(async () => json({}, 503));
    await expect(politeFetchJson("https://a.example/x", { fetchImpl, sleep, retries: 2 })).rejects.toThrow("503");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("spaces consecutive requests to the same host", async () => {
    const fetchImpl = vi.fn(async () => json({}));
    await politeFetchJson("https://a.example/1", { fetchImpl, sleep, minIntervalMs: 1000 });
    await politeFetchJson("https://a.example/2", { fetchImpl, sleep, minIntervalMs: 1000 });
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep.mock.calls[0]?.[0]).toBeGreaterThan(900);
  });
});

describe("redactUrl", () => {
  it("hides credentials passed as query params", () => {
    expect(redactUrl("https://api.adzuna.com/v1/x?app_id=abc&app_key=secret&what=nurse")).toBe(
      "https://api.adzuna.com/v1/x?app_id=[redacted]&app_key=[redacted]&what=nurse",
    );
  });

  it("is applied to HttpError messages", () => {
    expect(new HttpError(401, "https://a.example/?app_key=secret").message).not.toContain("secret");
  });
});
