import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db, schema } from "@/db";
import { PLANS, type PlanId } from "@/lib/plans";

export type UsageKind = "tailored_application" | "auto_fill" | "resume_parse";

/** Resume parsing is capped on every plan: it's the one AI call a script could loop on. */
const RESUME_PARSES_PER_MONTH = 5;

export function monthlyLimit(plan: PlanId, kind: UsageKind): number {
  const { limits } = PLANS[plan];
  if (kind === "tailored_application") return limits.tailoredPerMonth;
  if (kind === "auto_fill") return limits.autoFillPerMonth;
  return RESUME_PARSES_PER_MONTH;
}

export function usagePeriod(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type UsageResult = { ok: true; used: number; limit: number } | { ok: false; used: number; limit: number };

/**
 * Atomically claim one unit. A single upsert increments only while under the limit, so two
 * parallel requests can't both squeeze past the cap. Call `releaseUsage` if the work fails.
 */
export async function consumeUsage(userId: string, plan: PlanId, kind: UsageKind): Promise<UsageResult> {
  const limit = monthlyLimit(plan, kind);
  const period = usagePeriod();
  if (limit <= 0) return { ok: false, used: 0, limit };

  const table = schema.usageCounters;
  const [row] = await db()
    .insert(table)
    .values({ userId, period, kind, count: 1 })
    .onConflictDoUpdate({
      target: [table.userId, table.period, table.kind],
      set: { count: sql`${table.count} + 1` },
      setWhere: sql`${table.count} < ${limit}`,
    })
    .returning({ count: table.count });

  if (row) return { ok: true, used: row.count, limit };
  return { ok: false, used: await currentUsage(userId, kind), limit };
}

export async function releaseUsage(userId: string, kind: UsageKind) {
  const table = schema.usageCounters;
  await db()
    .update(table)
    .set({ count: sql`greatest(${table.count} - 1, 0)` })
    .where(and(eq(table.userId, userId), eq(table.period, usagePeriod()), eq(table.kind, kind)));
}

export async function currentUsage(userId: string, kind: UsageKind): Promise<number> {
  const table = schema.usageCounters;
  const row = await db().query.usageCounters.findFirst({
    where: and(eq(table.userId, userId), eq(table.period, usagePeriod()), eq(table.kind, kind)),
  });
  return row?.count ?? 0;
}
