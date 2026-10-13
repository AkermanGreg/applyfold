import { z } from "zod";

import { politeFetchJson } from "@/lib/http";

import { detectRemote } from "../normalize";
import { htmlToText } from "../text";
import type { NormalizedJob } from "../types";

/*
 * Workable's public career-widget feed (what employers embed on their own sites). Not a
 * documented partner API, so it's read gently: one request per board per day, capped.
 */

const workableLocation = z.looseObject({
  country: z.string().nullish(),
  city: z.string().nullish(),
  region: z.string().nullish(),
});

const workableJob = z.looseObject({
  title: z.string(),
  shortcode: z.string(),
  url: z.url(),
  application_url: z.url().nullish(),
  telecommuting: z.union([z.boolean(), z.string()]).nullish(),
  published_on: z.string().nullish(),
  created_at: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  country: z.string().nullish(),
  locations: z.array(workableLocation).nullish(),
  description: z.string().nullish(),
});

const workableAccount = z.looseObject({ name: z.string().nullish(), jobs: z.array(workableJob) });

/** Large staffing boards post thousands of roles; keep the freshest slice per run. */
export const WORKABLE_MAX_JOBS = 250;

function locationOf(job: z.infer<typeof workableJob>): string | null {
  const first = job.locations?.[0];
  const parts = [first?.city || job.city, first?.region || job.state, first?.country || job.country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export function mapWorkableAccount(slug: string, json: unknown, companyName?: string | null): NormalizedJob[] {
  const account = workableAccount.parse(json);
  const company = companyName || account.name?.split(",")[0]?.trim() || slug;
  return [...account.jobs]
    .sort((a, b) => (b.published_on ?? b.created_at ?? "").localeCompare(a.published_on ?? a.created_at ?? ""))
    .slice(0, WORKABLE_MAX_JOBS)
    .map((job) => {
      const location = locationOf(job);
      const remote = job.telecommuting === true || job.telecommuting === "True" || job.telecommuting === "true";
      const posted = job.published_on ?? job.created_at;
      return {
        sourceKind: "workable",
        externalId: `${slug}:${job.shortcode}`,
        title: job.title.trim(),
        company,
        location,
        remote: detectRemote(remote, location),
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
        description: htmlToText(job.description ?? ""),
        applyUrl: job.application_url ?? job.url,
        sourceUrl: null,
        atsType: "workable",
        postedAt: posted ? new Date(posted) : null,
        questions: null,
      };
    });
}

export async function fetchWorkableAccount(slug: string, companyName?: string | null): Promise<NormalizedJob[]> {
  const json = await politeFetchJson(
    `https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(slug)}?details=true`,
    { timeoutMs: 20_000 },
  );
  return mapWorkableAccount(slug, json, companyName);
}
