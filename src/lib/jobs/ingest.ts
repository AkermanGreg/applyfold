import "server-only";

import { and, eq, isNull, notInArray, sql } from "drizzle-orm";

import { db, schema } from "@/db";
import { serverEnv } from "@/lib/env";

import { dedupeKey } from "./normalize";
import { SEED_BOARDS } from "./seed-boards";
import { searchAdzuna } from "./sources/adzuna";
import { fetchAshbyBoard } from "./sources/ashby";
import { fetchGreenhouseBoard } from "./sources/greenhouse";
import { fetchLeverPostings } from "./sources/lever";
import { searchUsaJobs } from "./sources/usajobs";
import type { NormalizedJob } from "./types";

const BOARD_FETCHERS = {
  greenhouse: fetchGreenhouseBoard,
  lever: fetchLeverPostings,
  ashby: fetchAshbyBoard,
} as const;

/** Drop in-batch duplicates: Postgres rejects an upsert that touches the same row twice. */
export function uniqueByDedupeKey(jobs: NormalizedJob[]) {
  const seen = new Map<string, NormalizedJob>();
  for (const job of jobs) {
    const key = dedupeKey(job);
    if (!seen.has(key)) seen.set(key, job);
  }
  return [...seen.entries()].map(([key, job]) => ({ ...job, dedupeKey: key }));
}

async function upsertJobs(jobs: NormalizedJob[], sourceId: string | null) {
  const rows = uniqueByDedupeKey(jobs);
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    await db()
      .insert(schema.jobs)
      .values(chunk.map((job) => ({ ...job, sourceId })))
      .onConflictDoUpdate({
        target: schema.jobs.dedupeKey,
        set: {
          title: sql`excluded.title`,
          location: sql`excluded.location`,
          remote: sql`excluded.remote`,
          salaryMin: sql`excluded.salary_min`,
          salaryMax: sql`excluded.salary_max`,
          salaryCurrency: sql`excluded.salary_currency`,
          description: sql`excluded.description`,
          applyUrl: sql`excluded.apply_url`,
          closedAt: sql`null`,
          updatedAt: sql`now()`,
        },
      });
  }
  return rows.map((row) => row.dedupeKey);
}

async function ensureSeedSources() {
  await db()
    .insert(schema.jobSources)
    .values(SEED_BOARDS.map((board) => ({ kind: board.kind, slug: board.slug, companyName: board.companyName })))
    .onConflictDoNothing();
}

export type IngestReport = { source: string; jobs: number; error?: string };

/**
 * Refresh every enabled ATS board. Boards list only open roles, so a job that vanished from
 * its board is marked closed. One failing board never stops the run.
 */
export async function ingestBoards(options: { deadline: number }): Promise<IngestReport[]> {
  await ensureSeedSources();
  const sources = await db()
    .select()
    .from(schema.jobSources)
    .where(and(eq(schema.jobSources.enabled, true), sql`${schema.jobSources.kind} in ('greenhouse', 'lever', 'ashby')`));

  const reports: IngestReport[] = [];
  for (const source of sources) {
    if (Date.now() > options.deadline) break;
    const label = `${source.kind}:${source.slug}`;
    try {
      const fetcher = BOARD_FETCHERS[source.kind as keyof typeof BOARD_FETCHERS];
      const jobs = await fetcher(source.slug, source.companyName);
      const keys = await upsertJobs(jobs, source.id);
      await db()
        .update(schema.jobs)
        .set({ closedAt: new Date() })
        .where(
          and(
            eq(schema.jobs.sourceId, source.id),
            isNull(schema.jobs.closedAt),
            keys.length ? notInArray(schema.jobs.dedupeKey, keys) : sql`true`,
          ),
        );
      await db()
        .update(schema.jobSources)
        .set({ lastFetchedAt: new Date(), lastStatus: `ok: ${jobs.length}` })
        .where(eq(schema.jobSources.id, source.id));
      reports.push({ source: label, jobs: jobs.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await db()
        .update(schema.jobSources)
        .set({ lastFetchedAt: new Date(), lastStatus: `error: ${message.slice(0, 200)}` })
        .where(eq(schema.jobSources.id, source.id));
      reports.push({ source: label, jobs: 0, error: message });
    }
  }
  return reports;
}

/** Keyword searches on aggregators for one user's target titles and locations. */
export async function ingestForPreferences(preferences: { targetTitles: string[]; locations: string[] }) {
  const env = serverEnv();
  const titles = preferences.targetTitles.slice(0, 3);
  const location = preferences.locations[0];
  const reports: IngestReport[] = [];

  for (const title of titles) {
    if (env.USAJOBS_API_KEY && env.USAJOBS_EMAIL) {
      try {
        const jobs = await searchUsaJobs(
          { keyword: title, location },
          { apiKey: env.USAJOBS_API_KEY, email: env.USAJOBS_EMAIL },
        );
        await upsertJobs(jobs, null);
        reports.push({ source: `usajobs:${title}`, jobs: jobs.length });
      } catch (error) {
        reports.push({ source: `usajobs:${title}`, jobs: 0, error: String(error) });
      }
    }
    if (env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY) {
      try {
        const jobs = await searchAdzuna(
          { what: title, where: location },
          { appId: env.ADZUNA_APP_ID, appKey: env.ADZUNA_APP_KEY },
        );
        await upsertJobs(jobs, null);
        reports.push({ source: `adzuna:${title}`, jobs: jobs.length });
      } catch (error) {
        reports.push({ source: `adzuna:${title}`, jobs: 0, error: String(error) });
      }
    }
  }
  return reports;
}
