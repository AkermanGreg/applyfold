import { z } from "zod";

import { politeFetchJson } from "@/lib/http";

import { detectRemote } from "../normalize";
import { htmlToText } from "../text";
import type { JobQuestion, NormalizedJob } from "../types";

const BASE = "https://boards-api.greenhouse.io/v1/boards";

const ghJob = z.looseObject({
  id: z.number(),
  title: z.string(),
  absolute_url: z.url(),
  company_name: z.string().nullish(),
  location: z.looseObject({ name: z.string().nullish() }).nullish(),
  first_published: z.string().nullish(),
  updated_at: z.string().nullish(),
  content: z.string().nullish(),
});

const ghBoard = z.looseObject({ jobs: z.array(ghJob) });

const ghField = z.looseObject({
  name: z.string(),
  type: z.string(),
  values: z.array(z.looseObject({ label: z.string() })).nullish(),
});
const ghQuestion = z.looseObject({ label: z.string(), required: z.boolean().nullish(), fields: z.array(ghField) });
const ghJobWithQuestions = z.looseObject({
  questions: z.array(ghQuestion).nullish(),
  location_questions: z.array(ghQuestion).nullish(),
});

export function mapGreenhouseBoard(token: string, json: unknown, fallbackCompany?: string | null): NormalizedJob[] {
  const board = ghBoard.parse(json);
  return board.jobs.map((job) => {
    const location = job.location?.name?.trim() || null;
    const posted = job.first_published ?? job.updated_at;
    return {
      sourceKind: "greenhouse",
      externalId: `${token}:${job.id}`,
      title: job.title.trim(),
      company: job.company_name?.trim() || fallbackCompany || token,
      location,
      remote: detectRemote(location, job.title),
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      description: htmlToText(job.content ?? ""),
      applyUrl: job.absolute_url,
      sourceUrl: null,
      atsType: "greenhouse",
      postedAt: posted ? new Date(posted) : null,
      questions: null,
    };
  });
}

export function mapGreenhouseQuestions(json: unknown): JobQuestion[] {
  const job = ghJobWithQuestions.parse(json);
  return [...(job.questions ?? []), ...(job.location_questions ?? [])].map((question) => ({
    label: question.label,
    required: question.required ?? false,
    fields: question.fields.map((field) => ({
      name: field.name,
      type: field.type,
      ...(field.values?.length ? { options: field.values.map((value) => value.label) } : {}),
    })),
  }));
}

export async function fetchGreenhouseBoard(token: string, companyName?: string | null): Promise<NormalizedJob[]> {
  const json = await politeFetchJson(`${BASE}/${encodeURIComponent(token)}/jobs?content=true`);
  return mapGreenhouseBoard(token, json, companyName);
}

/** Questions cost one request per job, so they're fetched lazily when a user opens the job. */
export async function fetchGreenhouseQuestions(externalId: string): Promise<JobQuestion[]> {
  const [token, id] = externalId.split(":");
  if (!token || !id) throw new Error(`Bad Greenhouse external id: ${externalId}`);
  const json = await politeFetchJson(`${BASE}/${encodeURIComponent(token)}/jobs/${encodeURIComponent(id)}?questions=true`);
  return mapGreenhouseQuestions(json);
}
