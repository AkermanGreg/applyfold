import { normalizeTitle } from "@/lib/jobs/normalize";
import type { RemoteType } from "@/lib/jobs/types";

export type PrefilterPreferences = {
  targetTitles: string[];
  locations: string[];
  remote: "any" | "remote_only" | "hybrid_ok" | "onsite_ok";
  salaryMin: number | null;
};

export type PrefilterJob = {
  title: string;
  location: string | null;
  remote: RemoteType;
  salaryMax: number | null;
};

const STOP_WORDS = new Set(["and", "or", "of", "the", "a", "an", "for", "to", "in", "with", "i", "ii", "iii", "iv"]);

const tokens = (text: string) =>
  normalizeTitle(text)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

/** Share of a target title's words that appear in the job title (0–1), best over all targets. */
export function titleOverlap(jobTitle: string, targets: string[]): number {
  const jobTokens = new Set(tokens(jobTitle));
  let best = 0;
  for (const target of targets) {
    const targetTokens = tokens(target);
    if (targetTokens.length === 0) continue;
    const hits = targetTokens.filter((token) => jobTokens.has(token)).length;
    best = Math.max(best, hits / targetTokens.length);
  }
  return best;
}

function locationFits(job: PrefilterJob, preferences: PrefilterPreferences): boolean {
  if (preferences.remote === "remote_only") return job.remote === "remote";
  if (job.remote === "remote") return true;
  if (preferences.remote === "hybrid_ok" && job.remote === "onsite") return false;
  if (preferences.locations.length === 0 || !job.location) return true;
  const where = job.location.toLowerCase();
  // Match on the city part ("Columbus" from "Columbus, OH") so "Columbus, Ohio" still fits.
  return preferences.locations.some((place) => {
    const city = place.split(",")[0]!.trim().toLowerCase();
    return city.length > 1 && city !== "remote" && where.includes(city);
  });
}

/**
 * Free, instant first pass before any model call. Drops jobs that can't fit (wrong place,
 * salary capped below the user's floor, no title overlap) and ranks the rest.
 */
export function prefilter(job: PrefilterJob, preferences: PrefilterPreferences): { keep: boolean; rank: number } {
  const overlap = titleOverlap(job.title, preferences.targetTitles);
  if (overlap < 0.5) return { keep: false, rank: 0 };
  if (!locationFits(job, preferences)) return { keep: false, rank: 0 };
  if (preferences.salaryMin && job.salaryMax && job.salaryMax < preferences.salaryMin) return { keep: false, rank: 0 };
  return { keep: true, rank: overlap };
}
