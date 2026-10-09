import "server-only";

import { and, desc, eq, gte, isNull, notInArray, or, sql } from "drizzle-orm";

import { db, schema } from "@/db";
import { profileToFacts } from "@/lib/profile/schema";
import { getProfileRecord } from "@/lib/profile/store";

import { prefilter } from "./prefilter";
import { SCORING_BATCH_SIZE, scoreJobs } from "./score";

/** Upper bound on model-scored jobs per run (3 Haiku calls ≈ $0.003). */
const MAX_SCORED_PER_RUN = 45;
const AGGREGATOR_MAX_AGE_DAYS = 30;

function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (!min && !max) return null;
  const fmt = (value: number) => `${currency ?? ""} ${value.toLocaleString("en-US")}`.trim();
  return min && max ? `${fmt(min)}–${fmt(max)}` : fmt((min ?? max)!);
}

/**
 * Score new jobs for one user: rules prefilter → Haiku in batches → upsert matches. Existing
 * matches only get a fresh score and reason; `status` is never touched, so a job the user
 * skipped stays skipped.
 */
export async function runMatching(userId: string): Promise<{ scored: number }> {
  const [preferences, { profile }] = await Promise.all([
    db().query.preferences.findFirst({ where: eq(schema.preferences.userId, userId) }),
    getProfileRecord(userId),
  ]);
  if (!preferences || !profile || preferences.targetTitles.length === 0) return { scored: 0 };

  const alreadyMatched = db()
    .select({ jobId: schema.matches.jobId })
    .from(schema.matches)
    .where(eq(schema.matches.userId, userId));
  const cutoff = new Date(Date.now() - AGGREGATOR_MAX_AGE_DAYS * 86_400_000);

  const candidates = await db()
    .select()
    .from(schema.jobs)
    .where(
      and(
        isNull(schema.jobs.closedAt),
        notInArray(schema.jobs.id, alreadyMatched),
        // ATS boards list only open roles: no age cutoff. Aggregators: recent postings only.
        or(
          sql`${schema.jobs.sourceKind} in ('greenhouse', 'lever', 'ashby', 'manual')`,
          gte(schema.jobs.postedAt, cutoff),
        ),
      ),
    )
    .orderBy(desc(schema.jobs.postedAt))
    .limit(2_000);

  const shortlist = candidates
    .map((job) => ({ job, ...prefilter(job, preferences) }))
    .filter((entry) => entry.keep)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, MAX_SCORED_PER_RUN)
    .map((entry) => entry.job);

  const candidateFacts = profileToFacts(profile);
  let scored = 0;
  for (let i = 0; i < shortlist.length; i += SCORING_BATCH_SIZE) {
    const batch = shortlist.slice(i, i + SCORING_BATCH_SIZE);
    const scores = await scoreJobs({
      userId,
      candidateFacts,
      jobs: batch.map((job) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        remote: job.remote,
        salary: formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency),
        description: job.description,
      })),
    });
    if (scores.length === 0) continue;
    await db()
      .insert(schema.matches)
      .values(scores.map((entry) => ({ userId, jobId: entry.id, score: entry.score, reason: entry.reason })))
      .onConflictDoUpdate({
        target: [schema.matches.userId, schema.matches.jobId],
        // Deliberately excludes `status`: user decisions are sticky.
        set: { score: sql`excluded.score`, reason: sql`excluded.reason`, scoredAt: sql`now()` },
      });
    scored += scores.length;
  }
  return { scored };
}
