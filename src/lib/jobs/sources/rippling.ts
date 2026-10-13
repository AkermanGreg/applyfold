import { z } from "zod";

import { politeFetchJson } from "@/lib/http";

import { detectRemote } from "../normalize";
import { htmlToText } from "../text";
import type { NormalizedJob } from "../types";

/*
 * Rippling's public job-board endpoints (used by its career-page embeds). The list has no
 * descriptions, so each job costs one detail request; boards are small, and capped anyway.
 */

const BASE = "https://api.rippling.com/platform/api/ats/v1/board";
const MAX_JOBS = 60;

const listItem = z.looseObject({
  uuid: z.string(),
  name: z.string(),
  url: z.url(),
  workLocation: z.looseObject({ label: z.string().nullish() }).nullish(),
});

const detail = z.looseObject({
  uuid: z.string(),
  name: z.string(),
  url: z.url(),
  companyName: z.string().nullish(),
  createdOn: z.string().nullish(),
  workLocations: z.array(z.string()).nullish(),
  description: z.looseObject({ company: z.string().nullish(), role: z.string().nullish() }).nullish(),
});

export function mapRipplingJob(slug: string, json: unknown, companyName?: string | null): NormalizedJob {
  const job = detail.parse(json);
  const locations = job.workLocations ?? [];
  const location = locations.length ? locations.join("; ") : null;
  return {
    sourceKind: "rippling",
    externalId: `${slug}:${job.uuid}`,
    title: job.name.trim(),
    company: companyName || job.companyName?.replace(/\s+(US\s+)?(LLC|Inc\.?)$/i, "").trim() || slug,
    location,
    remote: detectRemote(location),
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    // Role first: the company blurb is the same on every posting.
    description: [htmlToText(job.description?.role ?? ""), htmlToText(job.description?.company ?? "")].filter(Boolean).join("\n\n"),
    applyUrl: job.url,
    sourceUrl: null,
    atsType: "rippling",
    postedAt: job.createdOn ? new Date(job.createdOn) : null,
    questions: null,
  };
}

export async function fetchRipplingBoard(slug: string, companyName?: string | null): Promise<NormalizedJob[]> {
  const list = z.array(listItem).parse(await politeFetchJson(`${BASE}/${encodeURIComponent(slug)}/jobs`));
  const jobs: NormalizedJob[] = [];
  for (const item of list.slice(0, MAX_JOBS)) {
    try {
      jobs.push(mapRipplingJob(slug, await politeFetchJson(`${BASE}/${encodeURIComponent(slug)}/jobs/${item.uuid}`), companyName));
    } catch {
      // One bad posting shouldn't drop the board.
    }
  }
  return jobs;
}
