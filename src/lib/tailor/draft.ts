import "server-only";

import { z } from "zod";

import { generateStructured } from "@/lib/ai/client";
import type { SavedAnswers } from "@/lib/answers/resolve";
import { STANDARD_QUESTION_BY_KEY, type StandardAnswerKey } from "@/lib/answers/standard";
import { type Profile, profileToFacts } from "@/lib/profile/schema";

import type { DraftAnswer } from "./questions";

const draftSchema = z.object({
  coverLetter: z.object({
    greeting: z.string().describe('e.g. "Dear Hiring Team," (use a named person only if the posting names one)'),
    paragraphs: z.array(z.string()).describe("3–4 short paragraphs"),
    closing: z.string().describe('e.g. "Sincerely,"'),
  }),
  answers: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      needsInput: z
        .string()
        .nullable()
        .describe("If the facts can't support a good answer, the specific fact to ask the candidate for"),
    }),
  ),
});

export type TailoredDraft = { coverLetter: z.infer<typeof draftSchema>["coverLetter"]; answers: DraftAnswer[] };

const SYSTEM = `You write job applications for a candidate, in their voice, for a job-search assistant used
in every field: nursing, teaching, trades, retail, sales, office work and tech.

The candidate's facts below are the only source of truth. Write specific, warm, plain-spoken text that a
hiring manager in that field would find credible: concrete duties, numbers and credentials from the facts,
connected to what this posting asks for. Avoid clichés ("I am writing to express my interest", "passionate",
"synergy") and avoid corporate jargon unless the field uses it.

Truthfulness is non-negotiable. Never invent or stretch experience, employers, dates, numbers, degrees,
licenses, or skills. When a question needs a fact the candidate facts don't contain, answer as well as the
facts allow and set needsInput to the missing fact, or leave the answer empty if nothing honest can be said.
It is fine to frame true facts favorably; it is never fine to imply something untrue.

Cover letter: under 300 words, no address block or date (the PDF adds those), signed with the candidate's
name. Answers: match each question's natural length; a yes/no question gets a short direct answer.`;

function savedAnswersSummary(saved: SavedAnswers): string {
  const lines = (Object.entries(saved) as [StandardAnswerKey, string][])
    .filter(([key]) => !key.startsWith("eeo_"))
    .map(([key, value]) => `- ${STANDARD_QUESTION_BY_KEY[key].prompt} ${value}`);
  return lines.length ? lines.join("\n") : "(none saved yet)";
}

export async function draftApplication(input: {
  userId: string;
  profile: Profile;
  saved: SavedAnswers;
  job: { title: string; company: string; location: string | null; description: string };
  openQuestions: string[];
}): Promise<TailoredDraft> {
  const posting = [
    `<posting>`,
    `${input.job.title} at ${input.job.company}${input.job.location ? ` (${input.job.location})` : ""}`,
    input.job.description.slice(0, 12_000),
    `</posting>`,
  ].join("\n");
  const questions = input.openQuestions.length
    ? `\n\nAnswer these application questions:\n${input.openQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
    : "\n\nNo application questions for this posting; return an empty answers list.";

  const result = await generateStructured({
    purpose: "tailored_application",
    userId: input.userId,
    tier: "draft",
    effort: "medium",
    maxTokens: 6_000,
    system: [
      { type: "text", text: SYSTEM },
      {
        type: "text",
        text: `<candidate_facts>\n${profileToFacts(input.profile)}\n</candidate_facts>\n\n<saved_screening_answers>\n${savedAnswersSummary(input.saved)}\n</saved_screening_answers>`,
      },
    ],
    content: [{ type: "text", text: `Write the cover letter for this posting.${questions}\n\n${posting}` }],
    schema: draftSchema,
  });

  return {
    coverLetter: result.coverLetter,
    answers: result.answers.map((answer) => ({ ...answer, source: "ai" as const })),
  };
}
