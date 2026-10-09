"use server";

import { and, desc, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { db, schema } from "@/db";
import { AiBudgetExceededError } from "@/lib/ai/client";
import { requireUserId } from "@/lib/auth";
import { type MatchStatus, setMatchStatus } from "@/lib/feed";
import { AddJobError, addJobForUser } from "@/lib/jobs/add-job";
import { runMatching } from "@/lib/matching/run";
import { ensureUser } from "@/lib/users";

const STATUSES: MatchStatus[] = ["new", "saved", "skipped", "applied"];

export async function setMatchStatusAction(jobId: string, status: MatchStatus) {
  const userId = await requireUserId();
  if (!STATUSES.includes(status)) throw new Error("Invalid status");
  await setMatchStatus(userId, jobId, status);
  refresh();
}

export type AddJobState = { status: "idle" } | { status: "error"; message: string };

export async function addJobAction(_previous: AddJobState, formData: FormData): Promise<AddJobState> {
  const userId = await requireUserId();
  const link = String(formData.get("link") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  if (!link && text.length < 200) return { status: "error", message: "Paste a link, or the full posting text." };

  await ensureUser(userId);
  let jobId: string;
  try {
    jobId = await addJobForUser(userId, link ? { link } : { text });
  } catch (error) {
    if (error instanceof AddJobError || error instanceof AiBudgetExceededError) {
      return { status: "error", message: error.message };
    }
    console.error("add job failed", error);
    return { status: "error", message: "We couldn't read that posting. Try pasting its text instead." };
  }
  redirect(`/app/jobs/${jobId}`);
}

const REFRESH_COOLDOWN_MS = 60 * 60 * 1000;

export type RefreshState = { status: "idle" } | { status: "done" | "error"; message: string };

/** Manual "find new matches", limited to once an hour per user. */
export async function refreshMatchesAction(_previous: RefreshState): Promise<RefreshState> {
  const userId = await requireUserId();
  const last = await db().query.events.findFirst({
    where: and(eq(schema.events.userId, userId), eq(schema.events.type, "matching_run")),
    orderBy: desc(schema.events.createdAt),
  });
  if (last && Date.now() - last.createdAt.getTime() < REFRESH_COOLDOWN_MS) {
    return { status: "error", message: "You can refresh matches once an hour. New jobs also arrive daily." };
  }
  try {
    const { scored } = await runMatching(userId);
    await db().insert(schema.events).values({ userId, type: "matching_run", data: { scored } });
    refresh();
    return { status: "done", message: scored ? `Scored ${scored} new jobs.` : "No new jobs right now. Check back tomorrow." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Something went wrong." };
  }
}
