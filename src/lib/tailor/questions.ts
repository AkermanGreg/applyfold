import { classifyQuestion, type ProfileFieldKey } from "@/lib/answers/classify";
import { resolveStandardAnswer, type SavedAnswers } from "@/lib/answers/resolve";
import type { JobQuestion } from "@/lib/jobs/types";
import { type Profile, splitName } from "@/lib/profile/schema";

export type AnswerSource = "standard" | "profile" | "ai" | "user";

export type DraftAnswer = {
  question: string;
  answer: string;
  source: AnswerSource;
  /** Set when we refuse to guess: the fact the user needs to supply. */
  needsInput: string | null;
};

/** Asked when the posting doesn't expose its own form questions. */
export const DEFAULT_OPEN_QUESTIONS = [
  "Why are you interested in this role?",
  "What makes you a strong fit for this position?",
];

function profileField(profile: Profile, key: ProfileFieldKey): string | null {
  const { contact } = profile;
  const name = splitName(contact.fullName);
  const current = profile.experience.find((job) => job.current) ?? profile.experience[0];
  switch (key) {
    case "first_name":
      return name.first;
    case "last_name":
      return name.last;
    case "full_name":
      return contact.fullName;
    case "email":
      return contact.email;
    case "phone":
      return contact.phone;
    case "location":
      return contact.location;
    case "postal_code":
      return contact.postalCode;
    case "linkedin":
      return contact.linkedin;
    case "website":
      return contact.website;
    case "current_company":
      return current?.employer ?? null;
    case "current_title":
      return current?.title ?? null;
  }
}

/**
 * Split a form's questions into ones we can answer deterministically (profile facts, saved
 * screening answers) and open questions for the drafter. File uploads are skipped: the user
 * attaches their resume and our cover-letter PDF themselves.
 */
export function planAnswers(
  questions: JobQuestion[],
  profile: Profile,
  saved: SavedAnswers,
): { answered: DraftAnswer[]; open: string[] } {
  const answered: DraftAnswer[] = [];
  const open: string[] = [];

  for (const question of questions) {
    const fieldTypes = question.fields.map((field) => field.type);
    const options = question.fields.flatMap((field) => field.options ?? []);
    const kind = classifyQuestion(question.label, fieldTypes);

    if (kind.type === "file") continue;
    if (kind.type === "open") {
      open.push(question.label);
      continue;
    }
    if (kind.type === "profile") {
      const value = profileField(profile, kind.key);
      answered.push({
        question: question.label,
        answer: value ?? "",
        source: "profile",
        needsInput: value ? null : `Add your ${kind.key.replace(/_/g, " ")} to your profile`,
      });
      continue;
    }
    const resolution = resolveStandardAnswer(kind.key, saved, options.length ? options : undefined);
    answered.push(
      resolution.status === "answered"
        ? { question: question.label, answer: resolution.value, source: "standard", needsInput: null }
        : { question: question.label, answer: "", source: "standard", needsInput: resolution.reason },
    );
  }
  return { answered, open };
}
