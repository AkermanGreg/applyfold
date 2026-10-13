import { desc, eq, gte } from "drizzle-orm";

import { db, schema } from "@/db";
import { AiBudgetExceededError } from "@/lib/ai/client";
import { isAuthorizedCron } from "@/lib/cron";
import { runMatching } from "@/lib/matching/run";

export const maxDuration = 300;

const ACTIVE_WINDOW_DAYS = 14;
const MAX_USERS_PER_RUN = 50;

/** Daily 06:00 UTC, an hour after ingestion: score new jobs for recently active users. */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return new Response("Unauthorized", { status: 401 });

  const started = Date.now();

  const since = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 86_400_000);
  const activeUsers = await db()
    .select({ userId: schema.users.id })
    .from(schema.users)
    .innerJoin(schema.preferences, eq(schema.preferences.userId, schema.users.id))
    .where(gte(schema.users.lastSeenAt, since))
    .orderBy(desc(schema.users.lastSeenAt))
    .limit(MAX_USERS_PER_RUN);

  const matching: { userId: string; scored: number; error?: string }[] = [];
  for (const { userId } of activeUsers) {
    if (Date.now() - started > 270_000) break;
    try {
      matching.push({ userId, ...(await runMatching(userId)) });
    } catch (error) {
      matching.push({ userId, scored: 0, error: error instanceof Error ? error.message : String(error) });
      if (error instanceof AiBudgetExceededError) break;
    }
  }

  return Response.json({ matching, ms: Date.now() - started });
}
