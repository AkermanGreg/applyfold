import { z } from "zod";

import { politeFetchJson } from "@/lib/http";

import { detectRemote } from "../normalize";
import type { NormalizedJob } from "../types";

const remuneration = z.looseObject({
  MinimumRange: z.union([z.string(), z.number()]).nullish(),
  MaximumRange: z.union([z.string(), z.number()]).nullish(),
  RateIntervalCode: z.string().nullish(),
});

const descriptor = z.looseObject({
  PositionID: z.string(),
  PositionTitle: z.string(),
  PositionURI: z.url(),
  ApplyURI: z.array(z.string()).nullish(),
  PositionLocationDisplay: z.string().nullish(),
  OrganizationName: z.string().nullish(),
  DepartmentName: z.string().nullish(),
  PositionRemuneration: z.array(remuneration).nullish(),
  PublicationStartDate: z.string().nullish(),
  QualificationSummary: z.string().nullish(),
  UserArea: z
    .looseObject({
      Details: z
        .looseObject({
          JobSummary: z.string().nullish(),
          MajorDuties: z.union([z.string(), z.array(z.string())]).nullish(),
        })
        .nullish(),
    })
    .nullish(),
});

const searchResponse = z.looseObject({
  SearchResult: z.looseObject({
    SearchResultItems: z.array(z.looseObject({ MatchedObjectDescriptor: descriptor })),
  }),
});

/** Annualize so salary filters compare like with like. Unknown intervals are dropped. */
function annualize(value: string | number | null | undefined, interval: string | null | undefined): number | null {
  const amount = typeof value === "string" ? Number(value) : value;
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return null;
  if (interval === "PA") return Math.round(amount);
  if (interval === "PH") return Math.round(amount * 2080);
  return null;
}

export function mapUsaJobs(json: unknown): NormalizedJob[] {
  return searchResponse.parse(json).SearchResult.SearchResultItems.map(({ MatchedObjectDescriptor: job }) => {
    const pay = job.PositionRemuneration?.[0];
    const duties = job.UserArea?.Details?.MajorDuties;
    const description = [
      job.UserArea?.Details?.JobSummary,
      Array.isArray(duties) ? duties.join("\n") : duties,
      job.QualificationSummary,
    ]
      .filter(Boolean)
      .join("\n\n");
    const location = job.PositionLocationDisplay?.trim() || null;
    return {
      sourceKind: "usajobs",
      externalId: job.PositionID,
      title: job.PositionTitle.trim(),
      company: job.OrganizationName?.trim() || job.DepartmentName?.trim() || "US Government",
      location,
      remote: detectRemote(location),
      salaryMin: annualize(pay?.MinimumRange, pay?.RateIntervalCode),
      salaryMax: annualize(pay?.MaximumRange, pay?.RateIntervalCode),
      salaryCurrency: pay ? "USD" : null,
      description,
      applyUrl: job.ApplyURI?.[0] ?? job.PositionURI,
      sourceUrl: job.PositionURI,
      atsType: "usajobs",
      postedAt: job.PublicationStartDate ? new Date(job.PublicationStartDate) : null,
      questions: null,
    };
  });
}

export type UsaJobsQuery = { keyword: string; location?: string; datePostedDays?: number };

export async function searchUsaJobs(
  query: UsaJobsQuery,
  credentials: { apiKey: string; email: string },
): Promise<NormalizedJob[]> {
  const params = new URLSearchParams({
    Keyword: query.keyword,
    ResultsPerPage: "100",
    DatePosted: String(query.datePostedDays ?? 30),
  });
  if (query.location) params.set("LocationName", query.location);
  const json = await politeFetchJson(`https://data.usajobs.gov/api/search?${params}`, {
    // USAJobs requires the registered email as User-Agent.
    headers: { "User-Agent": credentials.email, "Authorization-Key": credentials.apiKey, Host: "data.usajobs.gov" },
  });
  return mapUsaJobs(json);
}
