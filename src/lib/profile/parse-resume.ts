import "server-only";

import type Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";

import { generateStructured } from "@/lib/ai/client";

import { type Profile, profileSchema } from "./schema";

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

export const RESUME_TYPES = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
} as const;

export type ResumeType = (typeof RESUME_TYPES)[keyof typeof RESUME_TYPES];

const SYSTEM = `You convert resumes into a structured profile for a job-application assistant used by
people in every field: healthcare, education, trades, retail, sales, office work and tech.

Rules:
- Record only what the resume states. If something is not there, use null or an empty list.
- Never infer, estimate or embellish: no guessed dates, degrees, locations or skills.
- Keep each highlight in the candidate's own words, lightly cleaned up (fix spacing, drop bullet glyphs).
- Put licenses and certifications in "credentials". Never copy license or certificate numbers.
- Do not include references, photos, date of birth, marital status or other sensitive personal details.
- Order experience from most recent to oldest.`;

/** Turn an uploaded resume (PDF or DOCX) into a structured profile with one Claude call. */
export async function parseResume(input: { userId: string; type: ResumeType; bytes: Buffer }): Promise<Profile> {
  const content: Anthropic.ContentBlockParam[] =
    input.type === "pdf"
      ? [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: input.bytes.toString("base64") },
          },
          { type: "text", text: "Extract the structured profile from this resume." },
        ]
      : [
          {
            type: "text",
            text: `Extract the structured profile from this resume.\n\n<resume>\n${
              (await mammoth.extractRawText({ buffer: input.bytes })).value
            }\n</resume>`,
          },
        ];

  return generateStructured({
    purpose: "resume_parse",
    userId: input.userId,
    tier: "draft",
    effort: "low",
    system: [{ type: "text", text: SYSTEM }],
    content,
    schema: profileSchema,
  });
}
