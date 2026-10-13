import { PLANS, type PlanId } from "@/lib/plans";

/**
 * What a user may do right now. `unlimited` covers owner/staff accounts listed in the
 * OWNER_EMAILS env var (kept out of the repo): every feature, no monthly caps. The global AI
 * budget guard still applies to everyone.
 */
export type Entitlement = { plan: PlanId; label: string; unlimited: boolean };

export function parseOwnerEmails(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function entitlementFor(
  user: { email: string; plan: PlanId; planExpiresAt: Date | null },
  ownerEmails: Set<string>,
  now = new Date(),
): Entitlement {
  if (user.email && ownerEmails.has(user.email.trim().toLowerCase())) {
    return { plan: "autopilot", label: "Owner", unlimited: true };
  }
  // Paid plans fall back to free once their entitlement lapses (webhooks keep this fresh).
  const lapsed = user.plan !== "free" && user.planExpiresAt !== null && user.planExpiresAt < now;
  const plan = lapsed ? "free" : user.plan;
  return { plan, label: PLANS[plan].name, unlimited: false };
}
