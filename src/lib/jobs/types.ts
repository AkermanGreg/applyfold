/** ATS boards list only open roles for one employer; aggregators mix many employers. */
export const ATS_KINDS = ["greenhouse", "lever", "ashby", "workable", "rippling", "smartrecruiters"] as const;
export const AGGREGATOR_KINDS = ["usajobs", "adzuna", "remoteok", "themuse", "jsearch", "hn", "rss"] as const;

export type SourceKind = (typeof ATS_KINDS)[number] | (typeof AGGREGATOR_KINDS)[number] | "manual";
export type RemoteType = "remote" | "hybrid" | "onsite" | "unknown";

/** A question exposed by the source's own application form (Greenhouse only, for now). */
export type JobQuestion = {
  label: string;
  required: boolean;
  /** Form field name(s), e.g. `first_name` or `question_123`. */
  fields: { name: string; type: string; options?: string[] }[];
};

/** Every source maps into this shape before it touches the database. */
export type NormalizedJob = {
  sourceKind: SourceKind;
  externalId: string;
  title: string;
  company: string;
  location: string | null;
  remote: RemoteType;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  description: string;
  applyUrl: string;
  /** Aggregator page we must link back to for attribution (Adzuna). */
  sourceUrl: string | null;
  atsType: string | null;
  postedAt: Date | null;
  questions: JobQuestion[] | null;
};
