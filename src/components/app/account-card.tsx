import { Infinity as InfinityIcon, Sparkles } from "lucide-react";
import Link from "next/link";

import { Progress } from "@/components/ui/progress";
import { requireAppUser } from "@/lib/session";
import { currentUsage, monthlyLimit } from "@/lib/usage";

import { UserMenu } from "./user-menu";

/** Sidebar footer: plan, drafts left this month, and the account menu. */
export async function AccountCard() {
  const { userId, entitlement } = await requireAppUser();
  const used = await currentUsage(userId, "tailored_application");
  const limit = monthlyLimit(entitlement, "tailored_application");

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
      <div className="px-1">
        <UserMenu showName />
      </div>
    </div>
  );
}

export function AccountCardFallback() {
  return <div className="h-28 animate-pulse rounded-xl bg-muted" aria-hidden="true" />;
}
