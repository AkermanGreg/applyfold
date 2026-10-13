"use server";

import { refresh } from "next/cache";

import { saveAnswersForm, savePreferencesForm } from "@/lib/forms";
import { requireAppUser } from "@/lib/session";

export type FormState = { status: "idle" } | { status: "saved"; message: string } | { status: "error"; message: string };

export async function savePreferencesAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const { userId } = await requireAppUser();
  const result = await savePreferencesForm(userId, formData);
  if (!result.ok) return { status: "error", message: result.message };
  refresh();
  return { status: "saved", message: "Saved. We’re finding matches now; check Jobs in a minute." };
}

export async function saveAnswersAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const { userId } = await requireAppUser();
  await saveAnswersForm(userId, formData);
  refresh();
  return { status: "saved", message: "Answers saved." };
}
