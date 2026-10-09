import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { CRAWLER_USER_AGENT } from "@/lib/http";

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;

export function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 6) {
    const lower = address.toLowerCase();
    return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80") || lower.startsWith("::ffff:");
  }
  const [a, b] = address.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b! >= 16 && b! <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b! >= 64 && b! <= 127)
  );
}

async function assertPublicHost(url: URL) {
  const { address } = await lookup(url.hostname);
  if (isPrivateAddress(address)) throw new Error("That address isn't reachable.");
}

/**
 * Fetch a user-supplied job page once, as a browser would, but safely: public hosts only
 * (checked after DNS resolution and on every redirect hop), HTML only, size-capped, quick timeout.
 */
export async function safeFetchHtml(input: string): Promise<{ url: string; html: string }> {
  let url = new URL(input);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url);
    const response = await fetch(url, {
      redirect: "manual",
      headers: { "User-Agent": CRAWLER_USER_AGENT, Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) break;
      url = new URL(location, url);
      if (url.protocol !== "https:" && url.protocol !== "http:") break;
      continue;
    }
    if (!response.ok) throw new Error(`The page returned ${response.status}.`);
    if (!(response.headers.get("content-type") ?? "").includes("html")) throw new Error("That link isn't a web page.");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Empty page.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.byteLength;
    }
    await reader.cancel().catch(() => {});
    return { url: url.toString(), html: Buffer.concat(chunks).toString("utf8") };
  }
  throw new Error("Too many redirects.");
}
