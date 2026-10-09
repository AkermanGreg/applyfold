import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { getSavedAnswers } from "@/lib/answers/store";
import { decrypt, decryptJson, encrypt, encryptJson } from "@/lib/crypto";
import { fetchGreenhouseQuestions } from "@/lib/jobs/sources/greenhouse";
import type { JobQuestion } from "@/lib/jobs/types";
import { getProfileRecord } from "@/lib/profile/store";
import { draftApplication } from "@/lib/tailor/draft";
import type { CoverLetter } from "@/lib/tailor/pdf";
import { DEFAULT_OPEN_QUESTIONS, type DraftAnswer, planAnswers } from "@/lib/tailor/questions";
import { consumeUsage, releaseUsage } from "@/lib/usage";
import { effectivePlan, ensureUser } from "@/lib/users";

export type ApplicationStatus = (typeof schema.applicationStatusEnum.enumValues)[number];

export class UsageLimitError extends Error {
  constructor(
    public readonly used: number,
    public readonly limit: number,
  ) {
    super(`You've used all ${limit} tailored applications this month.`);
    this.name = "UsageLimitError";
  }
}

export class MissingProfileError extends Error {
  constructor() {
    super("Add your resume first so drafts can use your real experience.");
    this.name = "MissingProfileError";
  }
}

async function logEvent(userId: string, type: string, data: Record<string, unknown>, applicationId?: string) {
  await db().insert(schema.events).values({ userId, type, data, applicationId });
}

async function questionsFor(job: typeof schema.jobs.$inferSelect): Promise<JobQuestion[] | null> {
  if (job.questions) return job.questions as JobQuestion[];
  if (job.sourceKind !== "greenhouse" || !job.externalId) return null;
  try {
    const questions = await fetchGreenhouseQuestions(job.externalId);
    await db().update(schema.jobs).set({ questions }).where(eq(schema.jobs.id, job.id));
    return questions;
  } catch {
    return null; // The board may have closed the job; fall back to default questions.
  }
}

/** Generate (or regenerate) the tailored cover letter and answers for one job. */
export async function tailorApplication(userId: string, jobId: string, extraQuestions: string[] = []) {
  const user = await ensureUser(userId);
  const [{ profile }, saved, job] = await Promise.all([
    getProfileRecord(userId),
    getSavedAnswers(userId),
    db().query.jobs.findFirst({ where: eq(schema.jobs.id, jobId) }),
  ]);
  if (!profile) throw new MissingProfileError();
  if (!job) throw new Error("Job not found");

  const usage = await consumeUsage(userId, effectivePlan(user), "tailored_application");
  if (!usage.ok) throw new UsageLimitError(usage.used, usage.limit);

  try {
    const formQuestions = await questionsFor(job);
    const plan = formQuestions ? planAnswers(formQuestions, profile, saved) : { answered: [], open: [] };
    const openQuestions = [...new Set([...(formQuestions ? plan.open : DEFAULT_OPEN_QUESTIONS), ...extraQuestions])];
    const draft = await draftApplication({ userId, profile, saved, job, openQuestions });
    const answers: DraftAnswer[] = [...plan.answered, ...draft.answers];

    const [application] = await db()
      .insert(schema.applications)
      .values({ userId, jobId, coverLetterEnc: encryptJson(draft.coverLetter) })
      .onConflictDoUpdate({
        target: [schema.applications.userId, schema.applications.jobId],
        set: { coverLetterEnc: encryptJson(draft.coverLetter) },
      })
      .returning({ id: schema.applications.id });

    await db().delete(schema.applicationAnswers).where(eq(schema.applicationAnswers.applicationId, application!.id));
    if (answers.length) {
      await db()
        .insert(schema.applicationAnswers)
        .values(
          answers.map((answer, position) => ({
            applicationId: application!.id,
            position,
            question: answer.question,
            answerEnc: encrypt(JSON.stringify({ answer: answer.answer, needsInput: answer.needsInput })),
            source: answer.source,
          })),
        );
    }
    await db()
      .update(schema.matches)
      .set({ status: "saved" })
      .where(and(eq(schema.matches.userId, userId), eq(schema.matches.jobId, jobId), eq(schema.matches.status, "new")));
    await logEvent(
      userId,
      "draft_generated",
      { jobId, questions: answers.length, needsInput: answers.filter((a) => a.needsInput).length },
      application!.id,
    );
    return { applicationId: application!.id, usage };
  } catch (error) {
    await releaseUsage(userId, "tailored_application");
    throw error;
  }
}

export type ApplicationView = {
  id: string;
  status: ApplicationStatus;
  coverLetter: CoverLetter | null;
  answers: (DraftAnswer & { id: string })[];
  appliedAt: Date | null;
  followUpAt: Date | null;
};

export async function getApplicationForJob(userId: string, jobId: string): Promise<ApplicationView | null> {
  const application = await db().query.applications.findFirst({
    where: and(eq(schema.applications.userId, userId), eq(schema.applications.jobId, jobId)),
  });
  if (!application) return null;
  const answers = await db()
    .select()
    .from(schema.applicationAnswers)
    .where(eq(schema.applicationAnswers.applicationId, application.id))
    .orderBy(asc(schema.applicationAnswers.position));
  return {
    id: application.id,
    status: application.status,
    coverLetter: application.coverLetterEnc ? decryptJson<CoverLetter>(application.coverLetterEnc) : null,
    appliedAt: application.appliedAt,
    followUpAt: application.followUpAt,
    answers: answers.map((row) => {
      const { answer, needsInput } = JSON.parse(decrypt(row.answerEnc)) as { answer: string; needsInput: string | null };
      return { id: row.id, question: row.question, answer, needsInput, source: row.source };
    }),
  };
}

async function ownedApplication(userId: string, applicationId: string) {
  const application = await db().query.applications.findFirst({
    where: and(eq(schema.applications.id, applicationId), eq(schema.applications.userId, userId)),
  });
  if (!application) throw new Error("Application not found");
  return application;
}

const FOLLOW_UP_DAYS = 7;

export async function setApplicationStatus(userId: string, applicationId: string, status: ApplicationStatus) {
  const application = await ownedApplication(userId, applicationId);
  const now = new Date();
  await db()
    .update(schema.applications)
    .set({
      status,
      ...(status === "applied" && !application.appliedAt
        ? { appliedAt: now, followUpAt: new Date(now.getTime() + FOLLOW_UP_DAYS * 86_400_000) }
        : {}),
    })
    .where(eq(schema.applications.id, applicationId));
  if (status === "applied") {
    await db()
      .update(schema.matches)
      .set({ status: "applied" })
      .where(and(eq(schema.matches.userId, userId), eq(schema.matches.jobId, application.jobId)));
  }
  await logEvent(userId, "status_changed", { from: application.status, to: status }, applicationId);
}

export async function updateAnswer(userId: string, answerId: string, answer: string) {
  const [row] = await db()
    .select({ applicationId: schema.applicationAnswers.applicationId })
    .from(schema.applicationAnswers)
    .innerJoin(schema.applications, eq(schema.applications.id, schema.applicationAnswers.applicationId))
    .where(and(eq(schema.applicationAnswers.id, answerId), eq(schema.applications.userId, userId)));
  if (!row) throw new Error("Answer not found");
  await db()
    .update(schema.applicationAnswers)
    .set({ answerEnc: encrypt(JSON.stringify({ answer, needsInput: null })), source: "user" })
    .where(eq(schema.applicationAnswers.id, answerId));
}

export async function updateCoverLetter(userId: string, applicationId: string, letter: CoverLetter) {
  await ownedApplication(userId, applicationId);
  await db()
    .update(schema.applications)
    .set({ coverLetterEnc: encryptJson(letter) })
    .where(eq(schema.applications.id, applicationId));
}

export type TrackerItem = {
  applicationId: string;
  jobId: string;
  status: ApplicationStatus;
  title: string;
  company: string;
  appliedAt: Date | null;
  followUpAt: Date | null;
  updatedAt: Date;
};

export async function listApplications(userId: string): Promise<TrackerItem[]> {
  return db()
    .select({
      applicationId: schema.applications.id,
      jobId: schema.applications.jobId,
      status: schema.applications.status,
      title: schema.jobs.title,
      company: schema.jobs.company,
      appliedAt: schema.applications.appliedAt,
      followUpAt: schema.applications.followUpAt,
      updatedAt: schema.applications.updatedAt,
    })
    .from(schema.applications)
    .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
    .where(eq(schema.applications.userId, userId))
    .orderBy(desc(schema.applications.updatedAt));
}
