import { STANDARD_QUESTION_BY_KEY, type StandardAnswerKey } from "./standard";

export type SavedAnswers = Partial<Record<StandardAnswerKey, string>>;

export type Resolution =
  | { status: "answered"; value: string; source: "standard" | "default" }
  | { status: "needs_input"; key: StandardAnswerKey; reason: string };

const DECLINE = /decline|prefer not|don.?t wish|do not wish|choose not|not to (?:say|disclose|answer|self)|rather not|i do not want/i;

function pickYesNo(value: "yes" | "no", options: string[]): string | null {
  const yes = options.find((option) => /^\s*yes\b/i.test(option));
  const no = options.find((option) => /^\s*no\b/i.test(option));
  if (value === "yes" && yes) return yes;
  if (value === "no" && no) return no;
  return null;
}

function pickClosest(value: string, options: string[]): string | null {
  const wanted = value.toLowerCase().trim();
  return (
    options.find((option) => option.toLowerCase().trim() === wanted) ??
    options.find((option) => option.toLowerCase().includes(wanted) || wanted.includes(option.toLowerCase().trim())) ??
    null
  );
}

/**
 * Turn a saved answer into what the form wants. With `options` (a select / radio group) the
 * result is always one of them verbatim; without options it's the saved text. Never guesses:
 * an unknown answer or an option set we can't map comes back as `needs_input`.
 */
export function resolveStandardAnswer(key: StandardAnswerKey, saved: SavedAnswers, options?: string[]): Resolution {
  const question = STANDARD_QUESTION_BY_KEY[key];
  const stored = saved[key]?.trim();
  const value = stored || question.defaultValue;
  const source = stored ? "standard" : "default";

  if (!value) return { status: "needs_input", key, reason: "No saved answer yet" };

  if (question.kind === "eeo" && value === "decline") {
    if (!options?.length) return { status: "answered", value: "Decline to self-identify", source };
    const decline = options.find((option) => DECLINE.test(option));
    return decline
      ? { status: "answered", value: decline, source }
      : { status: "needs_input", key, reason: "This form has no option to decline" };
  }

  if (question.kind === "yes_no") {
    const normalized = /^y(es)?$/i.test(value) ? "yes" : /^no?$/i.test(value) ? "no" : null;
    if (!normalized) return { status: "needs_input", key, reason: "Saved answer isn't yes or no" };
    if (!options?.length) return { status: "answered", value: normalized === "yes" ? "Yes" : "No", source };
    const picked = pickYesNo(normalized, options);
    return picked
      ? { status: "answered", value: picked, source }
      : { status: "needs_input", key, reason: "Couldn't match the form's options" };
  }

  if (!options?.length) return { status: "answered", value, source };
  const picked = pickClosest(value, options) ?? (key === "how_did_you_hear" ? pickClosest("other", options) : null);
  return picked
    ? { status: "answered", value: picked, source }
    : { status: "needs_input", key, reason: "Couldn't match the form's options" };
}
