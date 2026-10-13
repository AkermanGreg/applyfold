"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { AiBudgetExceededError, AiOutputError } from "@/lib/ai/client";
import {
  type ApplicationStatus,
  MissingProfileError,
  setApplicationStatus,
  tailorApplication,
  updateAnswer,
  updateCoverLetter,
  UsageLimitError,
} from "@/lib/applications";
import { requireUserId } from "@/lib/auth";
import type { CoverLetter } from "@/lib/tailor/pdf";

export type TailorResult =
  | { ok: true }
  | { ok: false; code: "limit" | "profile" | "error"; message: string };

export async function tailorAction(jobId: string, extraQuestions: string[]): Promise<TailorResult> {
  const userId = await requireUserId();
  const questions = extraQuestions
    .map((question) => question.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((question) => question.slice(0, 500));
  try {
    await tailorApplication(userId, z.uuid().parse(jobId), questions);
    refresh();
    return { ok: true };
  } catch (error) {
    if (error instanceof UsageLimitError) return { ok: false, code: "limit", message: error.message };
    if (error instanceof MissingProfileError) return { ok: false, code: "profile", message: error.message };
    if (error instanceof AiBudgetExceededError || error instanceof AiOutputError) {
      return { ok: false, code: "error", message: error.message };
    }
    console.error("tailor failed", error);
    return { ok: false, code: "error", message: "Drafting failed. Your credit wasn't used; please try again." };
  }
}

export async function updateAnswerAction(answerId: string, answer: string) {
  const userId = await requireUserId();
  await updateAnswer(userId, z.uuid().parse(answerId), answer.slice(0, 5_000));
}

const coverLetterSchema = z.object({
  greeting: z.string().max(200),
  paragraphs: z.array(z.string().max(3_000)).max(8),
  closing: z.string().max(200),
});

export async function saveCoverLetterAction(applicationId: string, letter: CoverLetter) {
  const userId = await requireUserId();
  await updateCoverLetter(userId, z.uuid().parse(applicationId), coverLetterSchema.parse(letter));
}

const STATUSES: ApplicationStatus[] = ["saved", "applied", "interview", "offer", "rejected", "withdrawn"];

export async function setApplicationStatusAction(applicationId: string, status: ApplicationStatus) {
  const userId = await requireUserId();
  if (!STATUSES.includes(status)) throw new Error("Invalid status");
  await setApplicationStatus(userId, z.uuid().parse(applicationId), status);
  refresh();
}
