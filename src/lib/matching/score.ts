import "server-only";

import { z } from "zod";

import { generateStructured } from "@/lib/ai/client";

export type ScoringJob = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  remote: string;
  salary: string | null;
  description: string;
};

const scoresSchema = z.object({
  scores: z.array(
    z.object({
      id: z.string(),
      score: z.number().describe("0–100: how well this candidate fits this job"),
      reason: z.string().describe("One sentence, at most 20 words, naming the specific overlap or gap"),
    }),
  ),
});

const SYSTEM = `You rate how well a candidate fits job postings, for a job-search assistant used in every field.

Score 0–100 using only the candidate facts below:
- 85–100: meets the core requirements (licenses, years, key skills) and the level matches.
- 60–84: strong overlap with a gap the candidate could plausibly bridge.
- 30–59: partial overlap; a stretch.
- 0–29: wrong field, level, or a hard requirement (license, clearance, degree) is missing.

The reason must cite something concrete from the candidate facts ("4 years ICU, BLS current") or the
gap ("requires a CDL Class A"). Never invent candidate experience. Return one score per job id.`;

export const SCORING_BATCH_SIZE = 15;

/** Score up to SCORING_BATCH_SIZE jobs in one Haiku call. Candidate facts form the cached prefix. */
export async function scoreJobs(input: { userId: string; candidateFacts: string; jobs: ScoringJob[] }) {
  const jobsText = input.jobs
    .map((job) =>
      [
        `<job id="${job.id}">`,
        `${job.title} at ${job.company}`,
        `Location: ${job.location ?? "not stated"} (${job.remote})`,
        job.salary ? `Salary: ${job.salary}` : null,
        job.description.slice(0, 1_500),
        "</job>",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");

  const result = await generateStructured({
    purpose: "match_scoring",
    userId: input.userId,
    tier: "fast",
    effort: "low",
    maxTokens: 4_000,
    system: [
      { type: "text", text: SYSTEM },
      { type: "text", text: `<candidate>\n${input.candidateFacts}\n</candidate>` },
    ],
    content: [{ type: "text", text: `Score these jobs:\n\n${jobsText}` }],
    schema: scoresSchema,
  });

  const wanted = new Set(input.jobs.map((job) => job.id));
  return result.scores
    .filter((entry) => wanted.has(entry.id))
    .map((entry) => ({ ...entry, score: Math.max(0, Math.min(100, Math.round(entry.score))) }));
}
