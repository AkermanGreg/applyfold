"use client";

import { useActionState } from "react";

import type { FormState } from "@/app/app/preferences/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type Preferences, REMOTE_OPTIONS } from "@/lib/preferences";

const selectClass =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

export function PreferencesForm({
  initial,
  action,
}: {
  initial: Preferences | null;
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="targetTitles">Job titles you want</Label>
        <Textarea
          id="targetTitles"
          name="targetTitles"
          rows={2}
          required
          placeholder="Registered Nurse, ICU Nurse, Charge Nurse"
          defaultValue={initial?.targetTitles.join(", ")}
        />
        <p className="text-xs text-muted-foreground">Separate with commas. Up to 10.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="locations">Where you’d work</Label>
        <Textarea
          id="locations"
          name="locations"
          rows={2}
          placeholder={"Columbus, OH\nDayton, OH"}
          defaultValue={initial?.locations.join("\n")}
        />
        <p className="text-xs text-muted-foreground">One place per line. Leave empty for anywhere.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="remote">Remote</Label>
          <select id="remote" name="remote" defaultValue={initial?.remote ?? "any"} className={selectClass}>
            {REMOTE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="salaryMin">Minimum salary (yearly)</Label>
          <Input
            id="salaryMin"
            name="salaryMin"
            inputMode="numeric"
            placeholder="65,000"
            defaultValue={initial?.salaryMin?.toLocaleString("en-US") ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="salaryCurrency">Currency</Label>
          <select id="salaryCurrency" name="salaryCurrency" defaultValue={initial?.salaryCurrency ?? "USD"} className={selectClass}>
            {["USD", "GBP", "CAD", "AUD", "EUR"].map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save and find matches"}
        </Button>
        <p aria-live="polite" className="text-sm">
          {state.status === "saved" ? <span className="text-primary">{state.message}</span> : null}
          {state.status === "error" ? <span className="text-destructive">{state.message}</span> : null}
        </p>
      </div>
    </form>
  );
}
