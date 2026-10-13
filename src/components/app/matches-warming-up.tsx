"use client";

import { Loader2, PartyPopper } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const POLL_MS = 6_000;
const MAX_POLLS = 15;

/**
 * Shown right after onboarding. Matching runs in the background after preferences are saved,
 * so poll the server for up to ~90s until the first scored jobs land.
 */
export function MatchesWarmingUp({ waiting }: { waiting: boolean }) {
  const router = useRouter();
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    if (!waiting || polls >= MAX_POLLS) return;
    const timer = setTimeout(() => {
      router.refresh();
      setPolls((count) => count + 1);
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [waiting, polls, router]);

  return (
    <div className="surface flex items-start gap-4 border-primary/20 bg-accent/40 p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        {waiting ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <PartyPopper className="size-5" aria-hidden="true" />}
      </span>
      <div aria-live="polite">
        <p className="font-medium">{waiting ? "You’re all set. Finding your matches…" : "You’re all set!"}</p>
        <p className="text-sm text-muted-foreground">
          {waiting
            ? polls >= MAX_POLLS
              ? "This is taking longer than usual. New jobs also arrive every morning; check back soon."
              : "We’re searching job boards and scoring each role against your profile. This takes about a minute."
            : "Here are the roles that fit you best. Open one and click “Tailor my application”."}
        </p>
      </div>
    </div>
  );
}
