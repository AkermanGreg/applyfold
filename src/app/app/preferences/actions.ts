"use server";

import { refresh } from "next/cache";
import { after } from "next/server";

import { STANDARD_QUESTIONS, type StandardAnswerKey } from "@/lib/answers/standard";
import { saveAnswers } from "@/lib/answers/store";
import { requireUserId } from "@/lib/auth";
import { ingestForPreferences } from "@/lib/jobs/ingest";
import { runMatching } from "@/lib/matching/run";
import { preferencesFormSchema } from "@/lib/preferences";
import { savePreferences } from "@/lib/preferences-store";
import { ensureUser } from "@/lib/users";

export type FormState = { status: "idle" } | { status: "saved"; message: string } | { status: "error"; message: string };

export async function savePreferencesAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = preferencesFormSchema.safeParse({
    targetTitles: String(formData.get("targetTitles") ?? ""),
    locations: String(formData.get("locations") ?? ""),
    remote: formData.get("remote"),
    salaryMin: String(formData.get("salaryMin") ?? ""),
    salaryCurrency: formData.get("salaryCurrency"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the form." };

  await ensureUser(userId);
  await savePreferences(userId, parsed.data);
  // Search aggregators and score matches after responding, so saving feels instant.
  after(async () => {
    try {
      await ingestForPreferences(parsed.data);
      await runMatching(userId);
    } catch (error) {
      console.error("post-save matching failed", error);
    }
  });
  refresh();
  return { status: "saved", message: "Saved. We’re finding matches now; check Jobs in a minute." };
}

export async function saveAnswersAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const answers: Partial<Record<StandardAnswerKey, string>> = {};
  for (const question of STANDARD_QUESTIONS) {
    const value = formData.get(question.key);
    if (typeof value === "string") answers[question.key] = value.slice(0, 500);
  }
  await ensureUser(userId);
  await saveAnswers(userId, answers);
  refresh();
  return { status: "saved", message: "Answers saved." };
}
