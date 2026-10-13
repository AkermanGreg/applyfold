import { z } from "zod";

import { politeFetchJson } from "@/lib/http";

import { detectRemote } from "../normalize";
import type { NormalizedJob } from "../types";

/*
 * JSearch (OpenWeb Ninja on RapidAPI): a paid commercial API over Google for Jobs listings, so
 * it carries broad non-tech coverage. Only runs when JSEARCH_API_KEY is set. We only link out
 * to its apply links; we never fetch the publisher sites (LinkedIn, Indeed…) ourselves.
 */

const jsearchJob = z.looseObject({
  job_id: z.string(),
  job_title: z.string(),
  employer_name: z.string().nullish(),
  job_description: z.string().nullish(),
  job_apply_link: z.url(),
  job_city: z.string().nullish(),
  job_state: z.string().nullish(),
  job_country: z.string().nullish(),
  job_is_remote: z.boolean().nullish(),
  job_posted_at_datetime_utc: z.string().nullish(),
  job_min_salary: z.number().nullish(),
  job_max_salary: z.number().nullish(),
  job_salary_period: z.string().nullish(),
  job_publisher: z.string().nullish(),
});

const jsearchResponse = z.looseObject({ data: z.array(jsearchJob) });

const ANNUAL_FACTOR: Record<string, number> = { YEAR: 1, MONTH: 12, WEEK: 52, HOUR: 2080 };

export function mapJSearch(json: unknown): NormalizedJob[] {
  return jsearchResponse.parse(json).data.map((job) => {
    const location = [job.job_city, job.job_state, job.job_country].filter(Boolean).join(", ") || null;
    const factor = ANNUAL_FACTOR[(job.job_salary_period ?? "").toUpperCase()];
    const annual = (value: number | null | undefined) => (value && factor ? Math.round(value * factor) : null);
    const salaryMin = annual(job.job_min_salary);
    const salaryMax = annual(job.job_max_salary);
    return {
      sourceKind: "jsearch",
      externalId: job.job_id,
      title: job.job_title.trim(),
      company: job.employer_name?.trim() || "Unknown employer",
      location,
      remote: detectRemote(job.job_is_remote === true, location),
      salaryMin,
      salaryMax,
      salaryCurrency: salaryMin || salaryMax ? "USD" : null,
      description: (job.job_description ?? "").trim(),
      applyUrl: job.job_apply_link,
      sourceUrl: null,
      atsType: null,
      postedAt: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : null,
      questions: null,
    };
  });
}

export async function searchJSearch(query: { what: string; where?: string }, apiKey: string): Promise<NormalizedJob[]> {
  const params = new URLSearchParams({
    query: query.where ? `${query.what} in ${query.where}` : query.what,
    page: "1",
    num_pages: "1",
    date_posted: "month",
  });
  const json = await politeFetchJson(`https://jsearch.p.rapidapi.com/search?${params}`, {
    headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "jsearch.p.rapidapi.com" },
    timeoutMs: 20_000,
  });
  return mapJSearch(json);
}
