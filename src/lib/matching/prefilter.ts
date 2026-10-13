import { normalizeTitle } from "@/lib/jobs/normalize";
import type { RemoteType } from "@/lib/jobs/types";

export type PrefilterPreferences = {
  targetTitles: string[];
  locations: string[];
  remote: "any" | "remote_only" | "hybrid_ok" | "onsite_ok";
  salaryMin: number | null;
  /** Hint for the user's country when judging "Remote - <country>" listings. */
  salaryCurrency?: string;
};

/** Words that make a remote listing open to the user's country (by salary currency). */
const HOME_REGIONS: Record<string, RegExp> = {
  USD: /\b(united states|usa|u\.s\.|us|america|americas|north america)\b/,
  CAD: /\b(canada|north america|americas)\b/,
  GBP: /\b(united kingdom|uk|britain|england|scotland|wales|europe|emea)\b/,
  EUR: /\b(europe|eu|emea)\b/,
  AUD: /\b(australia|apac|anz|oceania)\b/,
};

const ANYWHERE = /\b(worldwide|anywhere|global|globally|international)\b/;

const PLACES =
  /\b(united states|usa|u\.s\.|us|canada|mexico|brazil|argentina|colombia|chile|peru|latam|latin america|united kingdom|uk|ireland|germany|france|spain|portugal|italy|netherlands|belgium|poland|romania|ukraine|serbia|europe|emea|india|pakistan|bangladesh|philippines|vietnam|indonesia|malaysia|singapore|japan|china|korea|apac|asia|australia|new zealand|africa|nigeria|kenya|south africa|egypt|israel|uae|turkey)\b/;

/**
 * Remote listings often hide a country restriction in the location ("Remote - Pakistan"). Allow
 * when no place is named, when it's open worldwide, or when it names the user's region.
 */
export function remoteRegionAllows(location: string | null, currency: string | undefined): boolean {
  if (!location) return true;
  const text = location.toLowerCase();
  if (!PLACES.test(text) || ANYWHERE.test(text)) return true;
  const home = HOME_REGIONS[currency ?? "USD"];
  return home ? home.test(text) : true;
}

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
  if (job.remote === "remote" && !remoteRegionAllows(job.location, preferences.salaryCurrency)) return false;
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
