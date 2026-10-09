import { z } from "zod";

import { politeFetchJson } from "@/lib/http";

import { detectRemote } from "../normalize";
import type { NormalizedJob } from "../types";

const adzunaResult = z.looseObject({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().nullish(),
  redirect_url: z.url(),
  created: z.string().nullish(),
  company: z.looseObject({ display_name: z.string().nullish() }).nullish(),
  location: z.looseObject({ display_name: z.string().nullish() }).nullish(),
  salary_min: z.number().nullish(),
  salary_max: z.number().nullish(),
  salary_is_predicted: z.union([z.number(), z.string()]).nullish(),
});

const adzunaResponse = z.looseObject({ results: z.array(adzunaResult) });

export const ADZUNA_COUNTRIES = { us: "USD", gb: "GBP", ca: "CAD", au: "AUD" } as const;
export type AdzunaCountry = keyof typeof ADZUNA_COUNTRIES;

export function mapAdzuna(json: unknown, country: AdzunaCountry): NormalizedJob[] {
  return adzunaResponse.parse(json).results.map((result) => {
    // Adzuna marks estimated salaries; we only show salaries the employer actually posted.
    const predicted = String(result.salary_is_predicted ?? "0") === "1";
    const location = result.location?.display_name?.trim() || null;
    const description = (result.description ?? "").trim();
    return {
      sourceKind: "adzuna",
      externalId: `${country}:${result.id}`,
      title: result.title.trim(),
      company: result.company?.display_name?.trim() || "Unknown employer",
      location,
      remote: detectRemote(location, result.title, description),
      salaryMin: predicted ? null : (result.salary_min ?? null),
      salaryMax: predicted ? null : (result.salary_max ?? null),
      salaryCurrency: predicted ? null : ADZUNA_COUNTRIES[country],
      // Adzuna only returns a snippet; the full posting is behind redirect_url.
      description,
      // Terms: listings must link through Adzuna, which also carries attribution.
      applyUrl: result.redirect_url,
      sourceUrl: result.redirect_url,
      atsType: null,
      postedAt: result.created ? new Date(result.created) : null,
      questions: null,
    };
  });
}

export type AdzunaQuery = { what: string; where?: string; country?: AdzunaCountry; maxDaysOld?: number };

export async function searchAdzuna(
  query: AdzunaQuery,
  credentials: { appId: string; appKey: string },
): Promise<NormalizedJob[]> {
  const country = query.country ?? "us";
  const params = new URLSearchParams({
    app_id: credentials.appId,
    app_key: credentials.appKey,
    what: query.what,
    results_per_page: "50",
    max_days_old: String(query.maxDaysOld ?? 30),
    "content-type": "application/json",
  });
  if (query.where) params.set("where", query.where);
  // Free tier allows ~25 requests/minute: keep a wide gap per request.
  const json = await politeFetchJson(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`, {
    minIntervalMs: 2_500,
  });
  return mapAdzuna(json, country);
}
