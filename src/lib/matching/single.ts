import "server-only";

import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { profileToFacts } from "@/lib/profile/schema";
import { getProfileRecord } from "@/lib/profile/store";

import { scoreJobs } from "./score";

/**
 * Score one job the user added themselves and save it to their list. Saved status signals
 * intent (they brought it to us); an existing match keeps whatever status the user set.
 */
export async function runMatchingForJob(userId: string, jobId: string) {
  const [{ profile }, job] = await Promise.all([
    getProfileRecord(userId),
    db().query.jobs.findFirst({ where: eq(schema.jobs.id, jobId) }),
  ]);
  if (!job) return;

  let score = 0;
  let reason = "Add your resume to see how well this fits.";
  if (profile) {
    const [result] = await scoreJobs({
      userId,
      candidateFacts: profileToFacts(profile),
      jobs: [
        {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          remote: job.remote,
          salary: null,
          description: job.description,
        },
      ],
    });
    if (result) ({ score, reason } = result);
  }

  await db()
    .insert(schema.matches)
    .values({ userId, jobId, score, reason, status: "saved" })
    .onConflictDoUpdate({ target: [schema.matches.userId, schema.matches.jobId], set: { score, reason, scoredAt: new Date() } });
}
