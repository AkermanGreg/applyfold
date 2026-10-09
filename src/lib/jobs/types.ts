export type SourceKind = "greenhouse" | "lever" | "ashby" | "usajobs" | "adzuna" | "manual";
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
