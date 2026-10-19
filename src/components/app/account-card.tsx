import { Infinity as InfinityIcon, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { Progress } from "@/components/ui/progress";
import { isAdminEmail } from "@/lib/admin";
import { requireAppUser } from "@/lib/session";
import { creditSummary } from "@/lib/usage";

import { UserMenu } from "./user-menu";

/** Sidebar footer: plan, drafts left this month, and the account menu. */
export async function AccountCard() {
  const { userId, user, entitlement } = await requireAppUser();
  const { used, monthlyLimit: limit, bonus } = await creditSummary(userId, entitlement, "tailored_application");
  const admin = isAdminEmail(user.email);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border bg-muted/50 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{entitlement.label} plan</span>
          {entitlement.unlimited ? (
            <span className="inline-flex items-center gap-1 text-xs text-primary">
              <InfinityIcon className="size-3.5" aria-hidden="true" /> Unlimited
            </span>
          ) : null}
        </div>
        {entitlement.unlimited ? (
          <p className="mt-1 text-xs text-muted-foreground">{used} drafts this month · every feature unlocked</p>
        ) : (
          <>
            <p className="mt-1 text-xs text-muted-foreground">
              {Math.max(0, limit - used)} of {limit} drafts left this month
              {bonus ? ` · +${bonus} bonus` : ""}
            </p>
            <Progress className="mt-2 h-1.5" value={Math.min(100, (used / Math.max(1, limit)) * 100)} aria-label="Drafts used" />
            {entitlement.plan === "free" ? (
              <Link href="/#pricing" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <Sparkles className="size-3.5" aria-hidden="true" /> Upgrade to Pro
              </Link>
            ) : null}
          </>
        )}
      </div>
      {admin ? (
        <Link href="/app/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
          <ShieldCheck className="size-4" aria-hidden="true" /> Admin
        </Link>
      ) : null}
      <div className="px-1">
        <UserMenu showName />
      </div>
    </div>
  );
}

export function AccountCardFallback() {
  return <div className="h-28 animate-pulse rounded-xl bg-muted" aria-hidden="true" />;
}
