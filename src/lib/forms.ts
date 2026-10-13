import "server-only";

import { after } from "next/server";

import { STANDARD_QUESTIONS, type StandardAnswerKey } from "@/lib/answers/standard";
import { saveAnswers } from "@/lib/answers/store";
import { ingestForPreferences } from "@/lib/jobs/ingest";
import { runMatching } from "@/lib/matching/run";
import { preferencesFormSchema } from "@/lib/preferences";
import { savePreferences } from "@/lib/preferences-store";

/*
 * Form handling shared by the settings pages and onboarding. Deliberately NOT in a
 * "use server" file: these take a userId, and every export of an actions file is a public
 * endpoint. Actions authenticate first, then call in here.
 */

export type FormResult = { ok: true } | { ok: false; message: string };

export async function savePreferencesForm(userId: string, formData: FormData): Promise<FormResult> {
  const parsed = preferencesFormSchema.safeParse({
    targetTitles: String(formData.get("targetTitles") ?? ""),
    locations: String(formData.get("locations") ?? ""),
    remote: formData.get("remote"),
    salaryMin: String(formData.get("salaryMin") ?? ""),
    salaryCurrency: formData.get("salaryCurrency"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };

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
  return { ok: true };
}

/** Saves whichever standard answers the form contains; untouched keys are left alone. */
export async function saveAnswersForm(userId: string, formData: FormData) {
  const answers: Partial<Record<StandardAnswerKey, string>> = {};
  for (const question of STANDARD_QUESTIONS) {
    const value = formData.get(question.key);
    if (typeof value === "string") answers[question.key] = value.slice(0, 500);
  }
  await saveAnswers(userId, answers);
}
