import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export const ONBOARDING_STEPS = ["Resume", "Basics", "Job search", "Quick answers"] as const;

export function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label={`Step ${current} of ${ONBOARDING_STEPS.length}`}>
      {ONBOARDING_STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary text-primary",
                !done && !active && "text-muted-foreground",
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check className="size-3.5" aria-hidden="true" /> : step}
            </span>
            <span className={cn("hidden text-sm sm:inline", active ? "font-medium" : "text-muted-foreground")}>{label}</span>
            {step < ONBOARDING_STEPS.length ? <span className="h-px flex-1 bg-border" aria-hidden="true" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
