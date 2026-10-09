"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState } from "react";

import { joinWaitlist } from "@/app/actions/waitlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WAITLIST_ROLES, type WaitlistState } from "@/lib/waitlist";

const initialState: WaitlistState = { status: "idle" };

export function WaitlistForm({ id = "waitlist" }: { id?: string }) {
  const [state, formAction, pending] = useActionState(joinWaitlist, initialState);

  if (state.status === "success") {
    return (
      <p role="status" className="flex items-center gap-2 rounded-lg border bg-accent px-4 py-3 text-sm text-accent-foreground">
        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex w-full max-w-lg flex-col gap-3" aria-describedby={`${id}-message`}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Label htmlFor={`${id}-email`} className="sr-only">
          Email address
        </Label>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.status === "error" ? state.email : ""}
          className="h-10 sm:flex-1"
          aria-invalid={state.status === "error" || undefined}
        />
        <Button type="submit" className="h-10 px-4" disabled={pending}>
          {pending ? "Joining…" : "Join the waitlist"}
        </Button>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Label htmlFor={`${id}-role`} className="font-normal">
          I work in
        </Label>
        <select
          id={`${id}-role`}
          name="role"
          defaultValue={state.status === "error" ? state.role : ""}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <option value="">Choose your field (optional)</option>
          {WAITLIST_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>
      {/* Honeypot: hidden from people and assistive tech. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <p id={`${id}-message`} aria-live="polite" className="min-h-5 text-sm text-destructive">
        {state.status === "error" ? state.message : ""}
      </p>
    </form>
  );
}
