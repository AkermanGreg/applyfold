/**
 * Plan catalogue. Limits here are what the server enforces (via usage_counters); the copy is
 * what the pricing page shows. RevenueCat entitlements map onto `id` in Phase 3.
 */
export type PlanId = "free" | "pro" | "autopilot";

export type Plan = {
  id: PlanId;
  name: string;
  priceLabel: string;
  priceNote?: string;
  pitch: string;
  limits: {
    /** Tailored applications (cover letter + drafted answers) per calendar month. */
    tailoredPerMonth: number;
    autoFillPerMonth: number;
    digest: "weekly" | "daily";
  };
  features: string[];
  comingSoon?: boolean;
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceLabel: "$0",
    pitch: "Everything you need to start applying with intent.",
    limits: { tailoredPerMonth: 5, autoFillPerMonth: 0, digest: "weekly" },
    features: [
      "Resume parsed into an editable profile",
      "Job feed with fit scores and why each role fits",
      "5 tailored applications a month",
      "Copy-paste apply panel",
      "Application tracker",
      "Weekly match digest",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceLabel: "$15/mo",
    priceNote: "or $120/year · 7-day free trial",
    pitch: "For an active search: tailor every application you send.",
    limits: { tailoredPerMonth: 100, autoFillPerMonth: 0, digest: "daily" },
    features: [
      "Everything in Free",
      "Unlimited tailored applications (fair use 100/mo)",
      "Cover letters as PDF",
      "Daily match digest",
      "Follow-up reminders",
    ],
  },
  autopilot: {
    id: "autopilot",
    name: "Autopilot",
    priceLabel: "$35/mo",
    pitch: "The assistant fills real application forms while you watch.",
    limits: { tailoredPerMonth: 100, autoFillPerMonth: 40, digest: "daily" },
    features: [
      "Everything in Pro",
      "40 auto-filled applications a month",
      "Live view: watch, take over, approve",
      "One-click hand-off for logins and captchas",
      "Screenshot audit trail of every submission",
    ],
    comingSoon: true,
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "pro", "autopilot"];
