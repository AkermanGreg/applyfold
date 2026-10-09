import { brand } from "@/lib/brand";

export const CRAWLER_USER_AGENT = `${brand.name}Bot/0.1 (+${brand.repoUrl})`;

const SECRET_PARAMS = /([?&](?:app_key|app_id|api_key|apikey|key|token|access_token)=)[^&]*/gi;

/** Some APIs (Adzuna) take credentials as query params; keep them out of errors and logs. */
export function redactUrl(url: string): string {
  return url.replace(SECRET_PARAMS, "$1[redacted]");
}

export class HttpError extends Error {
  public readonly url: string;

  constructor(
    public readonly status: number,
    url: string,
  ) {
    super(`HTTP ${status} for ${redactUrl(url)}`);
    this.name = "HttpError";
    this.url = redactUrl(url);
  }
}

type PoliteFetchOptions = {
  headers?: Record<string, string>;
  /** Abort a single attempt after this long. Fail fast rather than hang an ingestion run. */
  timeoutMs?: number;
  /** Retries for 429 / 5xx / network errors (not 4xx). */
  retries?: number;
  /** Minimum gap between requests to the same host. */
  minIntervalMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

const lastRequestAt = new Map<string, number>();

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function retryDelayMs(attempt: number, retryAfter: string | null): number {
  const seconds = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 30_000);
  return Math.min(500 * 2 ** attempt, 8_000);
}

/**
 * Fetch JSON from a third-party API without hammering it: identify ourselves, space requests
 * per host, back off on 429/5xx, and give up quickly so one slow board can't stall a run.
 */
export async function politeFetchJson<T = unknown>(url: string, options: PoliteFetchOptions = {}): Promise<T> {
  const {
    headers = {},
    timeoutMs = 10_000,
    retries = 2,
    minIntervalMs = 250,
    fetchImpl = fetch,
    sleep = defaultSleep,
  } = options;
  const host = new URL(url).host;

  for (let attempt = 0; ; attempt++) {
    const wait = (lastRequestAt.get(host) ?? 0) + minIntervalMs - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt.set(host, Date.now());

    let response: Response;
    try {
      response = await fetchImpl(url, {
        headers: { "User-Agent": CRAWLER_USER_AGENT, Accept: "application/json", ...headers },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      if (attempt >= retries) throw error;
      await sleep(retryDelayMs(attempt, null));
      continue;
    }

    if (response.ok) return (await response.json()) as T;

    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= retries) throw new HttpError(response.status, url);
    await sleep(retryDelayMs(attempt, response.headers.get("retry-after")));
  }
}

/** Test hook: forget per-host timing between test cases. */
export function resetHostThrottle() {
  lastRequestAt.clear();
}
