import "server-only";

import { z } from "zod";

import { db, schema } from "@/db";
import { generateStructured } from "@/lib/ai/client";
import { politeFetchJson } from "@/lib/http";
import { runMatchingForJob } from "@/lib/matching/single";

import { parseJobLink } from "./link";
import { dedupeKey, detectRemote } from "./normalize";
import { safeFetchHtml } from "./safe-fetch";
import { mapAshbyBoard } from "./sources/ashby";
import { mapGreenhouseBoard, mapGreenhouseQuestions } from "./sources/greenhouse";
import { mapLeverPostings } from "./sources/lever";
import { htmlToText } from "./text";
import type { NormalizedJob } from "./types";

export class AddJobError extends Error {}

const extractionSchema = z.object({
  isJobPosting: z.boolean(),
  title: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
});

/** Haiku pulls title/company/location out of arbitrary posting text. The description stays verbatim. */
async function extractPosting(userId: string, text: string) {
  return generateStructured({
    purpose: "job_extraction",
    userId,
    tier: "fast",
    effort: "low",
    maxTokens: 500,
    system: [
      {
        type: "text",
        text: "Identify the job posting in the text. Return its title, hiring company and location exactly as written, or null when not stated. Set isJobPosting=false if the text isn't a single job posting.",
      },
    ],
    content: [{ type: "text", text: text.slice(0, 15_000) }],
    schema: extractionSchema,
  });
}

async function fromText(userId: string, text: string, applyUrl: string | null): Promise<NormalizedJob> {
  const extracted = await extractPosting(userId, text);
  if (!extracted.isJobPosting || !extracted.title) {
    throw new AddJobError("That doesn't look like a job posting. Try pasting the full posting text.");
  }
  return {
    sourceKind: "manual",
    externalId: applyUrl ?? `text:${dedupeKey({ company: extracted.company ?? "", title: extracted.title })}`,
    title: extracted.title,
    company: extracted.company ?? "Unknown company",
    location: extracted.location,
    remote: detectRemote(extracted.location, text.slice(0, 2_000)),
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    description: text.slice(0, 15_000),
    applyUrl: applyUrl ?? "",
    sourceUrl: null,
    atsType: null,
    postedAt: null,
    questions: null,
  };
}

async function fromLink(userId: string, link: string): Promise<NormalizedJob> {
  const parsed = parseJobLink(link);
  switch (parsed.kind) {
    case "invalid":
      throw new AddJobError("That link doesn't look right. Paste the full https:// address.");
    case "blocked":
      throw new AddJobError(`We don't read ${parsed.host} automatically. Paste the posting text instead.`);
    case "greenhouse": {
      const json = await politeFetchJson(
        `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(parsed.token)}/jobs/${encodeURIComponent(parsed.id)}?questions=true`,
      );
      const [job] = mapGreenhouseBoard(parsed.token, { jobs: [json] });
      return { ...job!, questions: mapGreenhouseQuestions(json) };
    }
    case "lever": {
      const json = await politeFetchJson(
        `https://api.lever.co/v0/postings/${encodeURIComponent(parsed.slug)}/${encodeURIComponent(parsed.id)}?mode=json`,
      );
      return mapLeverPostings(parsed.slug, [json])[0]!;
    }
    case "ashby": {
      const json = await politeFetchJson(
        `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(parsed.slug)}?includeCompensation=true`,
      );
      const job = mapAshbyBoard(parsed.slug, json).find((candidate) => candidate.externalId.endsWith(`:${parsed.id}`));
      if (!job) throw new AddJobError("That Ashby posting is closed or unlisted.");
      return job;
    }
    case "page": {
      const page = await safeFetchHtml(parsed.url);
      return fromText(userId, htmlToText(page.html), page.url);
    }
  }
}

/** Add a job the user found themselves (link or pasted text) and score it for them. */
export async function addJobForUser(userId: string, input: { link?: string; text?: string }): Promise<string> {
  const job = input.link ? await fromLink(userId, input.link) : await fromText(userId, input.text ?? "", null);
  if (!job.applyUrl && !input.text) throw new AddJobError("We couldn't find where to apply for that job.");

  const key = dedupeKey(job);
  const [row] = await db()
    .insert(schema.jobs)
    .values({ ...job, dedupeKey: key })
    .onConflictDoUpdate({ target: schema.jobs.dedupeKey, set: { closedAt: null, updatedAt: new Date() } })
    .returning({ id: schema.jobs.id });
  await runMatchingForJob(userId, row!.id);
  return row!.id;
}
