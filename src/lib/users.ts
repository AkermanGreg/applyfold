import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import type { PlanId } from "@/lib/plans";

const SEEN_RESOLUTION_MS = 60 * 60 * 1000;

/** Create our row for a Clerk user on first use; afterwards just refresh last-seen (hourly). */
export async function ensureUser(userId: string) {
  const existing = await db().query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (existing) {
    if (Date.now() - existing.lastSeenAt.getTime() > SEEN_RESOLUTION_MS) {
      await db().update(schema.users).set({ lastSeenAt: new Date() }).where(eq(schema.users.id, userId));
    }
    return existing;
  }
  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress ?? "";
  const [created] = await db()
    .insert(schema.users)
    .values({ id: userId, email })
    .onConflictDoUpdate({ target: schema.users.id, set: { email } })
    .returning();
  return created!;
}

/** Paid plans fall back to free once their entitlement lapses (webhooks keep this fresh). */
export function effectivePlan(user: { plan: PlanId; planExpiresAt: Date | null }, now = new Date()): PlanId {
  if (user.plan === "free") return "free";
  return user.planExpiresAt && user.planExpiresAt < now ? "free" : user.plan;
}
