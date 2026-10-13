import { z } from "zod";

import { politeFetchJson } from "@/lib/http";

import { detectRemote } from "../normalize";
import { htmlToText } from "../text";
import type { NormalizedJob } from "../types";

/*
 * The Muse public jobs API. Off unless ENABLE_THE_MUSE=1: its terms (§3.4) require a link back
 * and forbid replicating The Muse's own services, which a job-search product arguably does.
 * Listings link through The Muse's landing page.
 */

const museJob = z.looseObject({
  id: z.union([z.number(), z.string()]),
  name: z.string(),
  contents: z.string().nullish(),
  publication_date: z.string().nullish(),
  locations: z.array(z.looseObject({ name: z.string() })).nullish(),
  company: z.looseObject({ name: z.string() }).nullish(),
  refs: z.looseObject({ landing_page: z.url() }),
});

const museResponse = z.looseObject({ results: z.array(museJob) });

export function mapTheMuse(json: unknown): NormalizedJob[] {
  return museResponse.parse(json).results.map((job) => {
    const location = job.locations?.map((place) => place.name).join("; ") || null;
    return {
      sourceKind: "themuse",
      externalId: String(job.id),
      title: job.name.trim(),
      company: job.company?.name ?? "Unknown employer",
      location,
      remote: detectRemote(location),
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      description: htmlToText(job.contents ?? ""),
      applyUrl: job.refs.landing_page,
      sourceUrl: job.refs.landing_page,
      atsType: null,
      postedAt: job.publication_date ? new Date(job.publication_date) : null,
      questions: null,
    };
  });
}

export async function searchTheMuse(query: { location?: string; category?: string }, apiKey?: string): Promise<NormalizedJob[]> {
  const params = new URLSearchParams({ page: "0" });
  if (query.location) params.set("location", query.location);
  if (query.category) params.set("category", query.category);
  if (apiKey) params.set("api_key", apiKey);
  return mapTheMuse(await politeFetchJson(`https://www.themuse.com/api/public/jobs?${params}`));
}
