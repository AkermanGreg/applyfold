/**
 * Canonical screening questions. Users answer each once during onboarding; the resolver maps
 * any employer's phrasing onto these keys. Nothing here is ever guessed: a missing answer is
 * surfaced as "needs input" and asked once, then saved.
 */
export type AnswerKind = "yes_no" | "text" | "eeo";

export type StandardAnswerKey =
  | "work_authorization"
  | "needs_sponsorship"
  | "age_18_plus"
  | "non_compete"
  | "background_check"
  | "willing_to_relocate"
  | "start_date"
  | "notice_period"
  | "salary_expectation"
  | "how_did_you_hear"
  | "eeo_gender"
  | "eeo_race"
  | "eeo_veteran"
  | "eeo_disability";

export type StandardQuestion = {
  key: StandardAnswerKey;
  kind: AnswerKind;
  /** How we ask it in onboarding. */
  prompt: string;
  help?: string;
  /** Only EEO questions have a default, and it is always to decline. */
  defaultValue?: string;
  group: "eligibility" | "availability" | "logistics" | "eeo";
};

export const STANDARD_QUESTIONS: StandardQuestion[] = [
  {
    key: "work_authorization",
    kind: "yes_no",
    group: "eligibility",
    prompt: "Are you legally authorized to work in the country where you're applying?",
  },
  {
    key: "needs_sponsorship",
    kind: "yes_no",
    group: "eligibility",
    prompt: "Will you now or in the future require visa sponsorship?",
  },
  {
    key: "age_18_plus",
    kind: "yes_no",
    group: "eligibility",
    prompt: "Are you at least 18 years old?",
  },
  {
    key: "non_compete",
    kind: "yes_no",
    group: "eligibility",
    prompt: "Are you bound by a non-compete or similar restrictive agreement?",
  },
  {
    key: "background_check",
    kind: "yes_no",
    group: "eligibility",
    prompt: "Are you willing to complete a background check?",
  },
  {
    key: "willing_to_relocate",
    kind: "yes_no",
    group: "logistics",
    prompt: "Are you open to relocating for the right role?",
  },
  {
    key: "start_date",
    kind: "text",
    group: "availability",
    prompt: "How soon could you start?",
    help: "For example: “Within two weeks” or “From 1 November”.",
  },
  {
    key: "notice_period",
    kind: "text",
    group: "availability",
    prompt: "What is your notice period at your current job?",
    help: "For example: “Two weeks” or “None, available immediately”.",
  },
  {
    key: "salary_expectation",
    kind: "text",
    group: "logistics",
    prompt: "What salary range are you targeting?",
    help: "Used only when a form requires it. For example: “$70,000–$80,000”.",
  },
  {
    key: "how_did_you_hear",
    kind: "text",
    group: "logistics",
    prompt: "How should we answer “How did you hear about us?”",
    help: "Most people use “Job board” or “Company website”.",
  },
  {
    key: "eeo_gender",
    kind: "eeo",
    group: "eeo",
    prompt: "Gender",
    defaultValue: "decline",
  },
  {
    key: "eeo_race",
    kind: "eeo",
    group: "eeo",
    prompt: "Race / ethnicity",
    defaultValue: "decline",
  },
  {
    key: "eeo_veteran",
    kind: "eeo",
    group: "eeo",
    prompt: "Veteran status",
    defaultValue: "decline",
  },
  {
    key: "eeo_disability",
    kind: "eeo",
    group: "eeo",
    prompt: "Disability status",
    defaultValue: "decline",
  },
];

export const STANDARD_QUESTION_BY_KEY = Object.fromEntries(
  STANDARD_QUESTIONS.map((question) => [question.key, question]),
) as Record<StandardAnswerKey, StandardQuestion>;

export function isStandardAnswerKey(value: string): value is StandardAnswerKey {
  return value in STANDARD_QUESTION_BY_KEY;
}
