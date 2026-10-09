import type { RemoteType } from "./types";

const TITLE_NOISE = [
  /\((?:m\/w\/d|m\/f\/d|f\/m\/x|all genders)\)/gi,
  /\b(?:remote|hybrid|on-?site)\b/gi,
  /\b(?:full|part)[ -]time\b/gi,
  /\b(?:urgent(?:ly)? hiring|immediate start|now hiring)\b/gi,
];

const TITLE_ABBREVIATIONS: [RegExp, string][] = [
  [/\bsr\.?(?=\s|$)/g, "senior"],
  [/\bjr\.?(?=\s|$)/g, "junior"],
  [/\bmgr\.?(?=\s|$)/g, "manager"],
  [/\brn\b/g, "registered nurse"],
  [/\basst\.?(?=\s|$)/g, "assistant"],
];

/** Lowercase, strip punctuation and noise words, expand common abbreviations. */
export function normalizeTitle(title: string): string {
  let value = title.toLowerCase();
  for (const pattern of TITLE_NOISE) value = value.replace(pattern, " ");
  value = value.replace(/[^a-z0-9&+#.\s]/g, " ");
  for (const [pattern, replacement] of TITLE_ABBREVIATIONS) value = value.replace(pattern, replacement);
  return value.replace(/\s+/g, " ").trim();
}

const COMPANY_SUFFIXES = /\b(?:inc|llc|ltd|limited|corp|corporation|co|gmbh|plc|pbc|s\.?a)\.?$/;

export function normalizeCompany(company: string): string {
  let value = company.toLowerCase().replace(/[^a-z0-9&\s.]/g, " ").replace(/\s+/g, " ").trim();
  // Strip trailing legal suffixes repeatedly ("Acme Co. Inc.").
  for (let i = 0; i < 2; i++) value = value.replace(COMPANY_SUFFIXES, "").replace(/[\s.]+$/, "");
  return value.trim();
}

/**
 * Dedupe on company + normalized title (+ location, so a chain hiring the same role in 40 cities
 * keeps 40 listings, while the same posting syndicated by two sources collapses to one).
 */
export function dedupeKey(input: { company: string; title: string; location?: string | null }): string {
  const location = (input.location ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return [normalizeCompany(input.company), normalizeTitle(input.title), location].join("|");
}

export function detectRemote(...hints: (string | null | undefined | boolean)[]): RemoteType {
  const text = hints
    .filter((hint) => typeof hint === "string")
    .join(" ")
    .toLowerCase();
  if (hints.includes(true) || /\bremote\b|work from home|\bwfh\b|anywhere/.test(text)) {
    return /\bhybrid\b/.test(text) ? "hybrid" : "remote";
  }
  if (/\bhybrid\b/.test(text)) return "hybrid";
  if (/\bon-?site\b|in[- ]office|in person/.test(text)) return "onsite";
  return "unknown";
}

/** Aggregators get a posted-date cutoff; ATS boards only list open roles, so they don't. */
export function isFreshEnough(postedAt: Date | null, maxAgeDays: number, now = new Date()): boolean {
  if (!postedAt) return true;
  return now.getTime() - postedAt.getTime() <= maxAgeDays * 86_400_000;
}
