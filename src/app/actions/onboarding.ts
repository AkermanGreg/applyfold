"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import type { FormState } from "@/app/actions/preferences";
import { saveAnswersForm, savePreferencesForm } from "@/lib/forms";
import { emptyProfile } from "@/lib/profile/schema";
import { getProfileRecord, saveProfile } from "@/lib/profile/store";
import { requireAppUser } from "@/lib/session";
import { markOnboarded } from "@/lib/users";

const optional = z
  .string()
  .trim()
  .max(200)
  .transform((value) => (value === "" ? null : value));

const basicsSchema = z.object({
  fullName: z.string().trim().min(1, "Add your name.").max(200),
  email: z.email({ error: "Enter a valid email." }).max(254),
  phone: optional,
  location: optional,
  postalCode: optional,
  headline: optional,
});

/** Step 2: confirm the contact details every application needs. Merges into the parsed profile. */
export async function saveBasicsAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const { userId } = await requireAppUser();
  const parsed = basicsSchema.safeParse(Object.fromEntries(["fullName", "email", "phone", "location", "postalCode", "headline"].map((key) => [key, String(formData.get(key) ?? "")])));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the form." };

  const { profile } = await getProfileRecord(userId);
  const base = profile ?? emptyProfile();
  const { headline, ...contact } = parsed.data;
  await saveProfile(userId, { ...base, headline: headline ?? base.headline, contact: { ...base.contact, ...contact } });
  redirect("/app/onboarding?step=3");
}

/** Step 3: what they're looking for; kicks off the first job search and scoring. */
export async function savePreferencesStepAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const { userId } = await requireAppUser();
  const result = await savePreferencesForm(userId, formData);
  if (!result.ok) return { status: "error", message: result.message };
  redirect("/app/onboarding?step=4");
}

/** Step 4: the handful of screening answers almost every form asks, then into the app. */
export async function finishOnboardingAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const { userId } = await requireAppUser();
  await saveAnswersForm(userId, formData);
  await markOnboarded(userId);
  redirect("/app/jobs?welcome=1");
}

export async function skipOnboardingAction() {
  const { userId } = await requireAppUser();
  await markOnboarded(userId);
  redirect("/app");
}
