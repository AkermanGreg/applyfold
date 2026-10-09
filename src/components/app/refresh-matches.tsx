"use client";

import { RefreshCw } from "lucide-react";
import { useActionState } from "react";

import type { RefreshState } from "@/app/app/jobs/actions";
import { Button } from "@/components/ui/button";

export function RefreshMatches({ action }: { action: (previous: RefreshState) => Promise<RefreshState> }) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        <RefreshCw className={pending ? "animate-spin" : undefined} aria-hidden="true" />
        {pending ? "Scoring…" : "Find new matches"}
      </Button>
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {state.status !== "idle" ? state.message : ""}
      </p>
    </form>
  );
}
