import "server-only";

import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db, schema } from "@/db";
import { parseOwnerEmails } from "@/lib/entitlements";
import { serverEnv } from "@/lib/env";
import type { PlanId } from "@/lib/plans";
import { requireAppUser } from "@/lib/session";
import { addBonusCredits, type UsageKind, usagePeriod } from "@/lib/usage";
import { getEntitlement } from "@/lib/users";

/** Admins are the owner accounts listed in OWNER_EMAILS (Vercel env, never committed). */
export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email) && parseOwnerEmails(serverEnv().OWNER_EMAILS).has(email!.trim().toLowerCase());
}

/** Gate for every admin page and action. Non-admins get a plain 404, not a hint the page exists. */
export async function requireAdmin() {
  const session = await requireAppUser();
  if (!isAdminEmail(session.user.email)) notFound();
  return session;
}

export type AdminStats = {
  users: number;
  newThisWeek: number;
  onboarded: number;
  activeThisWeek: number;
  draftsThisMonth: number;
  aiSpendThisMonth: number;
  waitlist: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [[users], [drafts], [spend], [waitlist]] = await Promise.all([
    db()
      .select({
        total: count(),
        newThisWeek: sql<number>`count(*) filter (where ${schema.users.createdAt} >= ${weekAgo})`,
        onboarded: sql<number>`count(${schema.users.onboardedAt})`,
        activeThisWeek: sql<number>`count(*) filter (where ${schema.users.lastSeenAt} >= ${weekAgo})`,
      })
      .from(schema.users),
    db()
      .select({ total: sql<number>`coalesce(sum(${schema.usageCounters.count}), 0)` })
      .from(schema.usageCounters)
      .where(and(eq(schema.usageCounters.period, usagePeriod()), eq(schema.usageCounters.kind, "tailored_application"))),
    db()
      .select({ total: sql<number>`coalesce(sum(${schema.aiUsage.costUsd}), 0)` })
      .from(schema.aiUsage)
      .where(gte(schema.aiUsage.createdAt, monthStart)),
    db().select({ total: count() }).from(schema.waitlist),
  ]);
  return {
    users: Number(users?.total ?? 0),
    newThisWeek: Number(users?.newThisWeek ?? 0),
    onboarded: Number(users?.onboarded ?? 0),
    activeThisWeek: Number(users?.activeThisWeek ?? 0),
    draftsThisMonth: Number(drafts?.total ?? 0),
    aiSpendThisMonth: Number(spend?.total ?? 0),
    waitlist: Number(waitlist?.total ?? 0),
  };
}

export type AdminUserRow = {
  id: string;
  email: string;
  createdAt: string;
  lastSeenAt: string;
  onboarded: boolean;
  hasResume: boolean;
  plan: string;
  planSource: string | null;
  planExpiresAt: string | null;
  isOwner: boolean;
  draftsThisMonth: number;
  bonusDrafts: number;
  applications: number;
};

/** Everyone who signed up, newest first, with the numbers an admin needs to help them. */
export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  const period = usagePeriod();
  const rows = await db()
    .select({
      user: schema.users,
      hasResume: sql<boolean>`${schema.profiles.resumeBlobPath} is not null`,
      draftsThisMonth: sql<number>`coalesce(${schema.usageCounters.count}, 0)`,
      bonusDrafts: sql<number>`coalesce(${schema.userCredits.balance}, 0)`,
      applications: sql<number>`(select count(*) from ${schema.applications} where ${schema.applications.userId} = ${schema.users.id})`,
    })
    .from(schema.users)
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
    .leftJoin(
      schema.usageCounters,
      and(
        eq(schema.usageCounters.userId, schema.users.id),
        eq(schema.usageCounters.period, period),
        eq(schema.usageCounters.kind, "tailored_application"),
      ),
    )
    .leftJoin(
      schema.userCredits,
      and(eq(schema.userCredits.userId, schema.users.id), eq(schema.userCredits.kind, "tailored_application")),
    )
    .orderBy(desc(schema.users.createdAt))
    .limit(500);

  return rows.map(({ user, hasResume, draftsThisMonth, bonusDrafts, applications }) => {
    const entitlement = getEntitlement(user);
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      lastSeenAt: user.lastSeenAt.toISOString(),
      onboarded: Boolean(user.onboardedAt),
      hasResume: Boolean(hasResume),
      plan: entitlement.label,
      planSource: user.planSource,
      planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
      isOwner: entitlement.unlimited,
      draftsThisMonth: Number(draftsThisMonth),
      bonusDrafts: Number(bonusDrafts),
      applications: Number(applications),
    };
  });
}

export async function listWaitlist() {
  return db().select().from(schema.waitlist).orderBy(desc(schema.waitlist.createdAt)).limit(500);
}

export async function listRecentGrants() {
  return db()
    .select({ grant: schema.creditGrants, email: schema.users.email })
    .from(schema.creditGrants)
    .innerJoin(schema.users, eq(schema.users.id, schema.creditGrants.userId))
    .orderBy(desc(schema.creditGrants.createdAt))
    .limit(30);
}

async function logGrant(entry: { userId: string; kind: string; amount: number; note: string | null; grantedBy: string }) {
  await db().insert(schema.creditGrants).values(entry);
}

export async function grantCredits(input: {
  adminEmail: string;
  userId: string;
  kind: UsageKind;
  amount: number;
  note: string | null;
}) {
  const target = await db().query.users.findFirst({ where: eq(schema.users.id, input.userId) });
  if (!target) throw new Error("User not found");
  await addBonusCredits(input.userId, input.kind, input.amount);
  await logGrant({ userId: input.userId, kind: input.kind, amount: input.amount, note: input.note, grantedBy: input.adminEmail });
}

/** Give a paid plan for a fixed number of days (beta testers). Marked "comp" so billing won't clobber it. */
export async function compPlan(input: { adminEmail: string; userId: string; plan: Exclude<PlanId, "free">; days: number; note: string | null }) {
  const expires = new Date(Date.now() + input.days * 86_400_000);
  const [updated] = await db()
    .update(schema.users)
    .set({ plan: input.plan, planExpiresAt: expires, planSource: "comp" })
    .where(eq(schema.users.id, input.userId))
    .returning({ id: schema.users.id });
  if (!updated) throw new Error("User not found");
  await logGrant({ userId: input.userId, kind: `plan:${input.plan}`, amount: input.days, note: input.note, grantedBy: input.adminEmail });
}

export async function revokeComp(input: { adminEmail: string; userId: string }) {
  await db()
    .update(schema.users)
    .set({ plan: "free", planExpiresAt: null, planSource: null })
    .where(and(eq(schema.users.id, input.userId), eq(schema.users.planSource, "comp")));
  await logGrant({ userId: input.userId, kind: "plan:revoked", amount: 0, note: null, grantedBy: input.adminEmail });
}
