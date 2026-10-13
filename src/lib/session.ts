import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { requireUserId } from "@/lib/auth";
import { ensureUser, getEntitlement } from "@/lib/users";

/**
 * The signed-in user with their entitlement, resolved once per request (React cache) however
 * many components ask. Redirects to sign-in when signed out.
 */
export const requireAppUser = cache(async () => {
  const userId = await requireUserId();
  const user = await ensureUser(userId);
  return { userId, user, entitlement: getEntitlement(user) };
});

/** Same, but sends people who haven't finished guided onboarding back to it. */
export async function requireOnboardedUser() {
  const session = await requireAppUser();
  if (!session.user.onboardedAt) redirect("/app/onboarding");
  return session;
}
