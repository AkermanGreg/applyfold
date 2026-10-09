import { z } from "zod";

import { politeFetchJson } from "@/lib/http";

import { detectRemote } from "../normalize";
import { htmlToText } from "../text";
import type { NormalizedJob } from "../types";

const salaryComponent = z.looseObject({
  compensationType: z.string(),
  currencyCode: z.string().nullish(),
  minValue: z.number().nullish(),
  maxValue: z.number().nullish(),
});

const ashbyJob = z.looseObject({
  id: z.string(),
  title: z.string(),
  location: z.string().nullish(),
  isRemote: z.boolean().nullish(),
  isListed: z.boolean().nullish(),
  workplaceType: z.string().nullish(),
  publishedAt: z.string().nullish(),
  jobUrl: z.url(),
  applyUrl: z.url().nullish(),
  descriptionPlain: z.string().nullish(),
  descriptionHtml: z.string().nullish(),
  compensation: z.looseObject({ summaryComponents: z.array(salaryComponent).nullish() }).nullish(),
});

const ashbyBoard = z.looseObject({ jobs: z.array(ashbyJob) });

function titleCase(slug: string) {
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function mapAshbyBoard(slug: string, json: unknown, companyName?: string | null): NormalizedJob[] {
  return ashbyBoard
    .parse(json)
    .jobs.filter((job) => job.isListed !== false)
    .map((job) => {
      const salary = job.compensation?.summaryComponents?.find((part) => part.compensationType === "Salary");
      const location = job.location?.trim() || null;
      return {
        sourceKind: "ashby",
        externalId: `${slug}:${job.id}`,
        title: job.title.trim(),
        company: companyName || titleCase(slug),
        location,
        remote: detectRemote(job.isRemote === true, job.workplaceType, location),
        salaryMin: salary?.minValue ?? null,
        salaryMax: salary?.maxValue ?? null,
        salaryCurrency: salary?.currencyCode ?? null,
        description: job.descriptionPlain?.trim() || htmlToText(job.descriptionHtml ?? ""),
        applyUrl: job.applyUrl ?? job.jobUrl,
        sourceUrl: null,
        atsType: "ashby",
        postedAt: job.publishedAt ? new Date(job.publishedAt) : null,
        questions: null,
      };
    });
}

export async function fetchAshbyBoard(slug: string, companyName?: string | null): Promise<NormalizedJob[]> {
  const json = await politeFetchJson(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}?includeCompensation=true`,
  );
  return mapAshbyBoard(slug, json, companyName);
}
