"use client";

import { Gift, Loader2, Ticket } from "lucide-react";
import { useActionState, useTransition } from "react";

import type { AdminActionState } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Action = (previous: AdminActionState, formData: FormData) => Promise<AdminActionState>;

function Status({ state }: { state: AdminActionState }) {
  if (state.status === "idle") return null;
  return (
    <p aria-live="polite" className={`text-xs ${state.status === "error" ? "text-destructive" : "text-primary"}`}>
      {state.message}
    </p>
  );
}

/** Per-user admin controls: add bonus drafts, or comp a paid plan for N days. */
export function AdminUserActions({
  userId,
  email,
  compActive,
  grantAction,
  compAction,
  revokeAction,
}: {
  userId: string;
  email: string;
  compActive: boolean;
  grantAction: Action;
  compAction: Action;
  revokeAction: (userId: string) => Promise<void>;
}) {
  const [grantState, grant, granting] = useActionState(grantAction, { status: "idle" });
  const [compState, comp, comping] = useActionState(compAction, { status: "idle" });
  const [revoking, startRevoke] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <form action={grant} className="flex flex-wrap items-center gap-2" aria-label={`Give drafts to ${email}`}>
        <input type="hidden" name="userId" value={userId} />
        <label className="sr-only" htmlFor={`amount-${userId}`}>
          Number of drafts
        </label>
        <Input id={`amount-${userId}`} name="amount" type="number" min={1} max={500} defaultValue={10} className="h-8 w-20" />
        <label className="sr-only" htmlFor={`note-${userId}`}>
          Note
        </label>
        <Input id={`note-${userId}`} name="note" placeholder="Note (optional)" className="h-8 min-w-0 flex-1" />
        <Button type="submit" size="sm" disabled={granting}>
          {granting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Gift aria-hidden="true" />} Add drafts
        </Button>
      </form>
      <Status state={grantState} />

      <div className="flex flex-wrap items-center gap-2">
        <form action={comp} className="flex flex-wrap items-center gap-2" aria-label={`Comp a plan for ${email}`}>
          <input type="hidden" name="userId" value={userId} />
          <label className="sr-only" htmlFor={`plan-${userId}`}>
            Plan
          </label>
          <select id={`plan-${userId}`} name="plan" defaultValue="pro" className="h-8 rounded-lg border bg-background px-2 text-sm">
            <option value="pro">Pro</option>
            <option value="autopilot">Autopilot</option>
          </select>
          <label className="sr-only" htmlFor={`days-${userId}`}>
            Days
          </label>
          <select id={`days-${userId}`} name="days" defaultValue="30" className="h-8 rounded-lg border bg-background px-2 text-sm">
            {[7, 14, 30, 60, 90].map((days) => (
              <option key={days} value={days}>
                {days} days
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="outline" disabled={comping}>
            {comping ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Ticket aria-hidden="true" />} Comp plan
          </Button>
        </form>
        {compActive ? (
          <Button size="sm" variant="ghost" disabled={revoking} onClick={() => startRevoke(() => revokeAction(userId))}>
            Revoke comp
          </Button>
        ) : null}
      </div>
      <Status state={compState} />
    </div>
  );
}
