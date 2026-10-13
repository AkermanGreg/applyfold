import { z } from "zod";

import { politeFetchJson } from "@/lib/http";

import { htmlToText } from "../text";
import type { NormalizedJob } from "../types";

/*
 * Remote OK public API. Terms: link back to the Remote OK URL with a followed link and
 * credit Remote OK as the source (we show "via Remote OK" on every listing). No logo use.
 */

const remoteOkJob = z.looseObject({
  id: z.union([z.string(), z.number()]),
  position: z.string(),
  company: z.string().nullish(),
  location: z.string().nullish(),
  description: z.string().nullish(),
  date: z.string().nullish(),
  url: z.url(),
  salary_min: z.union([z.number(), z.string()]).nullish(),
  salary_max: z.union([z.number(), z.string()]).nullish(),
});

const toNumber = (value: number | string | null | undefined) => {
  const number = typeof value === "string" ? Number(value) : value;
  return number && Number.isFinite(number) && number > 0 ? Math.round(number) : null;
};

export function mapRemoteOk(json: unknown): NormalizedJob[] {
  // The first element is the API's legal notice, not a job.
  const rows = z.array(z.unknown()).parse(json).slice(1);
  return rows.flatMap((row) => {
    const parsed = remoteOkJob.safeParse(row);
    if (!parsed.success) return [];
    const job = parsed.data;
    const salaryMin = toNumber(job.salary_min);
    const salaryMax = toNumber(job.salary_max);
    return [
      {
        sourceKind: "remoteok" as const,
        externalId: String(job.id),
        title: job.position.trim(),
        company: job.company?.trim() || "Unknown employer",
        location: job.location?.trim() || "Remote",
        remote: "remote" as const,
        salaryMin,
        salaryMax,
        salaryCurrency: salaryMin || salaryMax ? "USD" : null,
        description: htmlToText(job.description ?? ""),
        applyUrl: job.url,
        sourceUrl: job.url,
        atsType: null,
        postedAt: job.date ? new Date(job.date) : null,
        questions: null,
      },
    ];
  });
}

export async function fetchRemoteOk(): Promise<NormalizedJob[]> {
  return mapRemoteOk(await politeFetchJson("https://remoteok.com/api", { timeoutMs: 20_000 }));
}
