import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/*
 * Conventions
 * - `*_enc` columns hold AES-256-GCM ciphertext (see src/lib/crypto.ts). PII never sits in
 *   plaintext columns: resume text, structured profile, screening answers, cover letters.
 * - users.id is the Clerk user id, which is also the RevenueCat app user id.
 * - Deleting a user cascades to everything they own ("delete my data" is one statement).
 */

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const planEnum = pgEnum("plan", ["free", "pro", "autopilot"]);

export const users = pgTable("users", {
  id: text().primaryKey(),
  email: text().notNull(),
  plan: planEnum().notNull().default("free"),
  planExpiresAt: timestamp({ withTimezone: true }),
  consentedAt: timestamp({ withTimezone: true }),
  /** Touched at most hourly; the daily cron only scores matches for recently active users. */
  lastSeenAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  ...timestamps,
});

export const profiles = pgTable("profiles", {
  userId: text()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Encrypted JSON matching the Profile zod schema. */
  dataEnc: text(),
  resumeBlobPath: text(),
  resumeFilename: text(),
  resumeTextEnc: text(),
  parsedAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

export const remotePreferenceEnum = pgEnum("remote_preference", [
  "remote_only",
  "hybrid_ok",
  "onsite_ok",
  "any",
]);
export const digestFrequencyEnum = pgEnum("digest_frequency", ["off", "weekly", "daily"]);

export const preferences = pgTable("preferences", {
  userId: text()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  targetTitles: text().array().notNull().default(sql`'{}'::text[]`),
  locations: text().array().notNull().default(sql`'{}'::text[]`),
  remote: remotePreferenceEnum().notNull().default("any"),
  salaryMin: integer(),
  salaryCurrency: text().notNull().default("USD"),
  digest: digestFrequencyEnum().notNull().default("weekly"),
  ...timestamps,
});

/** Saved screening answers keyed by a canonical question key (e.g. `work_authorization`). */
export const standardAnswers = pgTable(
  "standard_answers",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text().notNull(),
    valueEnc: text().notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("standard_answers_user_key").on(t.userId, t.key)],
);

export const sourceKindEnum = pgEnum("source_kind", [
  "greenhouse",
  "lever",
  "ashby",
  "usajobs",
  "adzuna",
  "manual",
]);

/** A company board (ATS) or aggregator query we ingest from. */
export const jobSources = pgTable(
  "job_sources",
  {
    id: uuid().primaryKey().defaultRandom(),
    kind: sourceKindEnum().notNull(),
    /** ATS board token / slug, or an aggregator query key. */
    slug: text().notNull(),
    companyName: text(),
    enabled: boolean().notNull().default(true),
    addedByUserId: text().references(() => users.id, { onDelete: "set null" }),
    lastFetchedAt: timestamp({ withTimezone: true }),
    lastStatus: text(),
    ...timestamps,
  },
  (t) => [uniqueIndex("job_sources_kind_slug").on(t.kind, t.slug)],
);

export const remoteTypeEnum = pgEnum("remote_type", ["remote", "hybrid", "onsite", "unknown"]);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid().primaryKey().defaultRandom(),
    sourceId: uuid().references(() => jobSources.id, { onDelete: "set null" }),
    sourceKind: sourceKindEnum().notNull(),
    externalId: text(),
    title: text().notNull(),
    company: text().notNull(),
    location: text(),
    remote: remoteTypeEnum().notNull().default("unknown"),
    salaryMin: integer(),
    salaryMax: integer(),
    salaryCurrency: text(),
    description: text().notNull(),
    applyUrl: text().notNull(),
    /** Board/posting URL on the aggregator, kept for attribution backlinks. */
    sourceUrl: text(),
    atsType: text(),
    postedAt: timestamp({ withTimezone: true }),
    /** Application questions when the source exposes them (Greenhouse `?questions=true`). */
    questions: jsonb(),
    /** normalized company + normalized title; see src/lib/jobs/dedupe.ts */
    dedupeKey: text().notNull(),
    closedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("jobs_dedupe_key").on(t.dedupeKey),
    index("jobs_posted_at").on(t.postedAt),
  ],
);

/**
 * Per-user view of a job. `status` is user-owned and sticky: background re-scoring only
 * updates score/reason and must never move a row out of `skipped`.
 */
export const matchStatusEnum = pgEnum("match_status", ["new", "saved", "skipped", "applied"]);

export const matches = pgTable(
  "matches",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: uuid()
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    score: integer().notNull(),
    reason: text().notNull(),
    status: matchStatusEnum().notNull().default("new"),
    scoredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("matches_user_job").on(t.userId, t.jobId),
    index("matches_user_status_score").on(t.userId, t.status, t.score),
  ],
);

export const applicationStatusEnum = pgEnum("application_status", [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
]);

export const applications = pgTable(
  "applications",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: uuid()
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    status: applicationStatusEnum().notNull().default("saved"),
    coverLetterEnc: text(),
    coverLetterBlobPath: text(),
    appliedAt: timestamp({ withTimezone: true }),
    followUpAt: timestamp({ withTimezone: true }),
    notesEnc: text(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("applications_user_job").on(t.userId, t.jobId),
    index("applications_user_status").on(t.userId, t.status),
  ],
);

export const answerSourceEnum = pgEnum("answer_source", ["standard", "profile", "ai", "user"]);

export const applicationAnswers = pgTable(
  "application_answers",
  {
    id: uuid().primaryKey().defaultRandom(),
    applicationId: uuid()
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    position: integer().notNull(),
    question: text().notNull(),
    answerEnc: text().notNull(),
    source: answerSourceEnum().notNull(),
    ...timestamps,
  },
  (t) => [index("application_answers_application").on(t.applicationId, t.position)],
);

/** Append-only audit log: status changes, AI generations, and (Phase 2) every agent step. */
export const events = pgTable(
  "events",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    applicationId: uuid().references(() => applications.id, { onDelete: "cascade" }),
    type: text().notNull(),
    data: jsonb().notNull().default({}),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("events_user_created").on(t.userId, t.createdAt),
    index("events_application").on(t.applicationId, t.createdAt),
  ],
);

export const usageKindEnum = pgEnum("usage_kind", [
  "tailored_application",
  "auto_fill",
  "resume_parse",
]);

/** Monthly counters, period = 'YYYY-MM' (UTC). Enforced server-side before any AI call. */
export const usageCounters = pgTable(
  "usage_counters",
  {
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    period: text().notNull(),
    kind: usageKindEnum().notNull(),
    count: integer().notNull().default(0),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.userId, t.period, t.kind] })],
);

/**
 * One row per Claude call: what it was for, tokens, and estimated cost. Powers the global
 * monthly budget guard and the per-application cost figures in the case study.
 */
export const aiUsage = pgTable(
  "ai_usage",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text().references(() => users.id, { onDelete: "set null" }),
    purpose: text().notNull(),
    model: text().notNull(),
    inputTokens: integer().notNull(),
    outputTokens: integer().notNull(),
    cacheReadTokens: integer().notNull().default(0),
    cacheWriteTokens: integer().notNull().default(0),
    costUsd: doublePrecision().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ai_usage_created").on(t.createdAt), index("ai_usage_user_created").on(t.userId, t.createdAt)],
);

export const waitlist = pgTable("waitlist", {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  role: text(),
  source: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
