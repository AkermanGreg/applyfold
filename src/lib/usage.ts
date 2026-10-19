import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db, schema } from "@/db";
import type { Entitlement } from "@/lib/entitlements";
import { PLANS } from "@/lib/plans";

export type UsageKind = "tailored_application" | "auto_fill" | "resume_parse";

/** Resume parsing is capped on every plan: it's the one AI call a script could loop on. */
const RESUME_PARSES_PER_MONTH = 5;

export function monthlyLimit(entitlement: Entitlement, kind: UsageKind): number {
  if (entitlement.unlimited) return Number.POSITIVE_INFINITY;
  const { limits } = PLANS[entitlement.plan];
  if (kind === "tailored_application") return limits.tailoredPerMonth;
  if (kind === "auto_fill") return limits.autoFillPerMonth;
  return RESUME_PARSES_PER_MONTH;
}

export function usagePeriod(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Which pool a unit came from, so a failed operation can refund the right one. */
export type UsagePool = "monthly" | "bonus";

export type UsageResult =
  | { ok: true; used: number; limit: number; pool: UsagePool }
  | { ok: false; used: number; limit: number };

/**
 * Atomically claim one unit: from the monthly plan allowance first, then from bonus credits an
 * admin granted. Each step is a single conditional statement, so parallel requests can't
 * squeeze past either cap. Call `releaseUsage` with the returned pool if the work fails.
 */
export async function consumeUsage(userId: string, entitlement: Entitlement, kind: UsageKind): Promise<UsageResult> {
  const limit = monthlyLimit(entitlement, kind);
  const period = usagePeriod();
  const table = schema.usageCounters;

  if (!Number.isFinite(limit)) {
    // Unlimited accounts still count usage, so cost reporting stays accurate.
    const [row] = await db()
      .insert(table)
      .values({ userId, period, kind, count: 1 })
      .onConflictDoUpdate({ target: [table.userId, table.period, table.kind], set: { count: sql`${table.count} + 1` } })
      .returning({ count: table.count });
    return { ok: true, used: row?.count ?? 1, limit, pool: "monthly" };
  }

  if (limit > 0) {
    const [row] = await db()
      .insert(table)
      .values({ userId, period, kind, count: 1 })
      .onConflictDoUpdate({
        target: [table.userId, table.period, table.kind],
        set: { count: sql`${table.count} + 1` },
        setWhere: sql`${table.count} < ${limit}`,
      })
      .returning({ count: table.count });
    if (row) return { ok: true, used: row.count, limit, pool: "monthly" };
  }

  const credits = schema.userCredits;
  const [bonus] = await db()
    .update(credits)
    .set({ balance: sql`${credits.balance} - 1` })
    .where(and(eq(credits.userId, userId), eq(credits.kind, kind), sql`${credits.balance} > 0`))
    .returning({ balance: credits.balance });
  if (bonus) return { ok: true, used: await currentUsage(userId, kind), limit, pool: "bonus" };

  return { ok: false, used: await currentUsage(userId, kind), limit };
}

export async function releaseUsage(userId: string, kind: UsageKind, pool: UsagePool = "monthly") {
  if (pool === "bonus") {
    await addBonusCredits(userId, kind, 1);
    return;
  }
  const table = schema.usageCounters;
  await db()
    .update(table)
    .set({ count: sql`greatest(${table.count} - 1, 0)` })
    .where(and(eq(table.userId, userId), eq(table.period, usagePeriod()), eq(table.kind, kind)));
}

export async function addBonusCredits(userId: string, kind: UsageKind, amount: number) {
  const credits = schema.userCredits;
  await db()
    .insert(credits)
    .values({ userId, kind, balance: amount })
    .onConflictDoUpdate({ target: [credits.userId, credits.kind], set: { balance: sql`${credits.balance} + ${amount}` } });
}

export async function bonusBalance(userId: string, kind: UsageKind): Promise<number> {
  const row = await db().query.userCredits.findFirst({
    where: and(eq(schema.userCredits.userId, userId), eq(schema.userCredits.kind, kind)),
  });
  return row?.balance ?? 0;
}

export async function currentUsage(userId: string, kind: UsageKind): Promise<number> {
  const table = schema.usageCounters;
  const row = await db().query.usageCounters.findFirst({
    where: and(eq(table.userId, userId), eq(table.period, usagePeriod()), eq(table.kind, kind)),
  });
  return row?.count ?? 0;
}

export type CreditSummary = { used: number; monthlyLimit: number; bonus: number; remaining: number | null };

/** What the UI shows: drafts left this month including bonus credits (null = unlimited). */
export async function creditSummary(userId: string, entitlement: Entitlement, kind: UsageKind): Promise<CreditSummary> {
  const [used, bonus] = await Promise.all([currentUsage(userId, kind), bonusBalance(userId, kind)]);
  return remainingCredits({ used, monthlyLimit: monthlyLimit(entitlement, kind), bonus });
}

export function remainingCredits({ used, monthlyLimit, bonus }: { used: number; monthlyLimit: number; bonus: number }): CreditSummary {
  const remaining = Number.isFinite(monthlyLimit) ? Math.max(0, monthlyLimit - used) + bonus : null;
  return { used, monthlyLimit, bonus, remaining };
}
