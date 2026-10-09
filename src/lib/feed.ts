import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db, schema } from "@/db";

export type MatchStatus = (typeof schema.matchStatusEnum.enumValues)[number];

/** Shape the feed UI renders. Shared with demo mode, which supplies fixture data instead. */
export type FeedItem = {
  jobId: string;
  title: string;
  company: string;
  location: string | null;
  remote: "remote" | "hybrid" | "onsite" | "unknown";
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  postedAt: string | null;
  score: number;
  reason: string;
  status: MatchStatus;
  /** Aggregator attribution (Adzuna terms require a visible credit + link). */
  attribution: { label: string; url: string } | null;
};

export async function getFeed(userId: string): Promise<FeedItem[]> {
  const rows = await db()
    .select({ match: schema.matches, job: schema.jobs })
    .from(schema.matches)
    .innerJoin(schema.jobs, eq(schema.jobs.id, schema.matches.jobId))
    .where(eq(schema.matches.userId, userId))
    .orderBy(desc(schema.matches.score), desc(schema.jobs.postedAt))
    .limit(300);
  return rows.map(({ match, job }) => toFeedItem(match, job));
}

export function toFeedItem(
  match: typeof schema.matches.$inferSelect,
  job: typeof schema.jobs.$inferSelect,
): FeedItem {
  return {
    jobId: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    remote: job.remote,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    postedAt: job.postedAt?.toISOString() ?? null,
    score: match.score,
    reason: match.reason,
    status: match.status,
    attribution: job.sourceKind === "adzuna" && job.sourceUrl ? { label: "Jobs by Adzuna", url: job.sourceUrl } : null,
  };
}

/** The user's own decision. Background re-scoring never calls this. */
export async function setMatchStatus(userId: string, jobId: string, status: MatchStatus) {
  await db()
    .update(schema.matches)
    .set({ status })
    .where(and(eq(schema.matches.userId, userId), eq(schema.matches.jobId, jobId)));
}

export async function getJobForUser(userId: string, jobId: string) {
  const [row] = await db()
    .select({ match: schema.matches, job: schema.jobs })
    .from(schema.matches)
    .innerJoin(schema.jobs, eq(schema.jobs.id, schema.matches.jobId))
    .where(and(eq(schema.matches.userId, userId), eq(schema.matches.jobId, jobId)));
  return row ?? null;
}
