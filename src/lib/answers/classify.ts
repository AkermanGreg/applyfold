import type { StandardAnswerKey } from "./standard";

export type ProfileFieldKey =
  | "first_name"
  | "last_name"
  | "full_name"
  | "email"
  | "phone"
  | "location"
  | "postal_code"
  | "linkedin"
  | "website"
  | "current_company"
  | "current_title";

export type QuestionClass =
  | { type: "standard"; key: StandardAnswerKey }
  | { type: "profile"; key: ProfileFieldKey }
  | { type: "file"; key: "resume" | "cover_letter" }
  /** Free-form or compound question: drafted by the model from profile facts + saved answers. */
  | { type: "open" };

type Rule = { test: RegExp; result: QuestionClass };

const standard = (key: StandardAnswerKey): QuestionClass => ({ type: "standard", key });
const profile = (key: ProfileFieldKey): QuestionClass => ({ type: "profile", key });

const AUTHORIZATION = String.raw`(?:authori[sz]ed|eligible|entitled|permitted|legally able|right)\b.{0,40}\bwork|work authori[sz]ation|right to work`;
const SPONSORSHIP = String.raw`sponsor|\bvisa\b|h-?1b|work permit`;

/**
 * Ordered rules: the first match wins, so more specific phrasings come first. The ordering is
 * the point. "Authorized to work *without sponsorship*" must resolve to work authorization
 * (Yes) before the generic sponsorship rule can claim it (No).
 */
const RULES: Rule[] = [
  // Demographic (EEO) questions.
  { test: /\bgender\b|\bsex\b|pronoun/, result: standard("eeo_gender") },
  { test: /\brace\b|ethnicity|hispanic|latin[oax]/, result: standard("eeo_race") },
  { test: /veteran/, result: standard("eeo_veteran") },
  { test: /disabilit/, result: standard("eeo_disability") },

  // Eligibility, most specific first.
  { test: new RegExp(`(?:${AUTHORIZATION}).{0,60}\\bwithout\\b.{0,30}(?:${SPONSORSHIP})`), result: standard("work_authorization") },
  { test: new RegExp(SPONSORSHIP), result: standard("needs_sponsorship") },
  { test: new RegExp(AUTHORIZATION), result: standard("work_authorization") },
  // "Non-compete" and "non-competition" are the same question; so are restrictive covenants.
  { test: /non[\s-]?compet(?:e|ition|itive)|restrictive covenant|non[\s-]?solicit/, result: standard("non_compete") },
  { test: /\b(?:18|eighteen)\b.{0,20}(?:years|older|age)|at least 18|over 18|legal (?:working )?age/, result: standard("age_18_plus") },
  { test: /background (?:check|screen|investigation)|drug (?:test|screen)/, result: standard("background_check") },
  { test: /relocat/, result: standard("willing_to_relocate") },
  { test: /notice period|how much notice/, result: standard("notice_period") },
  { test: /start date|when can you start|available to start|earliest (?:start|availability)|date (?:you are )?available/, result: standard("start_date") },
  { test: /(?:salary|compensation|pay|rate)\s+(?:expectation|requirement|range|desired)|desired (?:salary|pay|compensation)|expected (?:salary|compensation|pay)/, result: standard("salary_expectation") },
  { test: /how did you (?:hear|find|learn)|where did you (?:hear|find|see)|referral source|source of (?:application|referral)/, result: standard("how_did_you_hear") },

  // Contact details straight from the profile.
  { test: /^(?:legal |preferred )?first name|given name|^preferred name/, result: profile("first_name") },
  { test: /last name|surname|family name/, result: profile("last_name") },
  { test: /^(?:full |legal )?name\*?$/, result: profile("full_name") },
  { test: /e-?mail/, result: profile("email") },
  { test: /phone|mobile|telephone|\bcell\b/, result: profile("phone") },
  { test: /linkedin/, result: profile("linkedin") },
  { test: /website|portfolio|personal site|github/, result: profile("website") },
  { test: /\bzip\b|postal ?code|post ?code/, result: profile("postal_code") },
  { test: /current (?:company|employer)|most recent (?:company|employer)/, result: profile("current_company") },
  { test: /current (?:job )?title|most recent (?:job )?title/, result: profile("current_title") },
  { test: /^(?:city|location|current location)\b|where are you (?:based|located)/, result: profile("location") },
];

export function classifyQuestion(label: string, fieldTypes: string[] = []): QuestionClass {
  const text = label.toLowerCase().replace(/\s+/g, " ").trim();

  if (fieldTypes.includes("input_file") || /^(?:resume|cv)\b|resume\/cv/.test(text)) {
    return /cover letter/.test(text) ? { type: "file", key: "cover_letter" } : { type: "file", key: "resume" };
  }
  if (/^cover letter/.test(text)) return { type: "file", key: "cover_letter" };

  // Asking authorization and sponsorship in one breath needs both facts: let the drafter combine them.
  const asksAuthorization = new RegExp(AUTHORIZATION).test(text);
  const asksSponsorship = new RegExp(SPONSORSHIP).test(text);
  if (asksAuthorization && asksSponsorship && !/\bwithout\b/.test(text)) return { type: "open" };

  return RULES.find((rule) => rule.test.test(text))?.result ?? { type: "open" };
}
