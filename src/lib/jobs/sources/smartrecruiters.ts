import { z } from "zod";

import { politeFetchJson } from "@/lib/http";

import { detectRemote } from "../normalize";
import { htmlToText } from "../text";
import type { NormalizedJob } from "../types";

/*
 * SmartRecruiters' official public Posting API. Lists carry no description, so we fetch the
 * newest postings' details, capped: big employers (Bosch, Sodexo) list thousands.
 */

const BASE = "https://api.smartrecruiters.com/v1/companies";
const MAX_JOBS = 60;

const location = z.looseObject({
  city: z.string().nullish(),
  region: z.string().nullish(),
  country: z.string().nullish(),
  remote: z.boolean().nullish(),
  hybrid: z.boolean().nullish(),
});

const listResponse = z.looseObject({
  content: z.array(z.looseObject({ id: z.string(), releasedDate: z.string().nullish() })),
});

const section = z.looseObject({ text: z.string().nullish() }).nullish();

const posting = z.looseObject({
  id: z.string(),
  name: z.string(),
  company: z.looseObject({ name: z.string().nullish() }).nullish(),
  location: location.nullish(),
  releasedDate: z.string().nullish(),
  postingUrl: z.url().nullish(),
  applyUrl: z.url().nullish(),
  jobAd: z
    .looseObject({
      sections: z
        .looseObject({
          jobDescription: section,
          qualifications: section,
          additionalInformation: section,
          companyDescription: section,
        })
        .nullish(),
    })
    .nullish(),
});

export function mapSmartRecruitersPosting(companyId: string, json: unknown, companyName?: string | null): NormalizedJob {
  const job = posting.parse(json);
  const loc = job.location;
  const where = [loc?.city, loc?.country?.toUpperCase()].filter(Boolean).join(", ") || null;
  const sections = job.jobAd?.sections;
  const description = [sections?.jobDescription, sections?.qualifications, sections?.additionalInformation]
    .map((part) => htmlToText(part?.text ?? ""))
    .filter(Boolean)
    .join("\n\n");
  const remote = loc?.remote ? "remote" : loc?.hybrid ? "hybrid" : detectRemote(where);
  const url = job.postingUrl ?? job.applyUrl ?? `https://jobs.smartrecruiters.com/${companyId}/${job.id}`;
  return {
    sourceKind: "smartrecruiters",
    externalId: `${companyId}:${job.id}`,
    title: job.name.trim(),
    company: companyName || job.company?.name || companyId,
    location: where,
    remote,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    description,
    applyUrl: url,
    sourceUrl: null,
    atsType: "smartrecruiters",
    postedAt: job.releasedDate ? new Date(job.releasedDate) : null,
    questions: null,
  };
}

export async function fetchSmartRecruitersPostings(companyId: string, companyName?: string | null): Promise<NormalizedJob[]> {
  const id = encodeURIComponent(companyId);
  const list = listResponse.parse(await politeFetchJson(`${BASE}/${id}/postings?limit=100`));
  const newest = [...list.content]
    .sort((a, b) => (b.releasedDate ?? "").localeCompare(a.releasedDate ?? ""))
    .slice(0, MAX_JOBS);
  const jobs: NormalizedJob[] = [];
  for (const item of newest) {
    try {
      jobs.push(mapSmartRecruitersPosting(companyId, await politeFetchJson(`${BASE}/${id}/postings/${item.id}`), companyName));
    } catch {
      // Skip one bad posting, keep the rest.
    }
  }
  return jobs;
}

export async function fetchSmartRecruitersPosting(companyId: string, postingId: string): Promise<NormalizedJob> {
  const json = await politeFetchJson(`${BASE}/${encodeURIComponent(companyId)}/postings/${encodeURIComponent(postingId)}`);
  return mapSmartRecruitersPosting(companyId, json);
}
