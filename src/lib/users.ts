import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { type Entitlement, entitlementFor, parseOwnerEmails } from "@/lib/entitlements";
import { serverEnv } from "@/lib/env";

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

export type AppUser = typeof schema.users.$inferSelect;

export function getEntitlement(user: Pick<AppUser, "email" | "plan" | "planExpiresAt">): Entitlement {
  return entitlementFor(user, parseOwnerEmails(serverEnv().OWNER_EMAILS));
}

export async function markOnboarded(userId: string) {
  await db().update(schema.users).set({ onboardedAt: new Date() }).where(eq(schema.users.id, userId));
}
