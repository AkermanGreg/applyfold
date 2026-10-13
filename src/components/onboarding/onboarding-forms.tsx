"use client";

import { useActionState } from "react";

import type { FormState } from "@/app/actions/preferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Action = (previous: FormState, formData: FormData) => Promise<FormState>;

function ErrorText({ state }: { state: FormState }) {
  return (
    <p aria-live="polite" className="min-h-5 text-sm text-destructive">
      {state.status === "error" ? state.message : ""}
    </p>
  );
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  type = "text",
  required = false,
  autoComplete,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  placeholder?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>
        {label}
        {required ? null : <span className="font-normal text-muted-foreground"> (optional)</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-10"
      />
    </div>
  );
}

export function BasicsForm({
  action,
  initial,
}: {
  action: Action;
  initial: { fullName: string | null; email: string | null; phone: string | null; location: string | null; postalCode: string | null; headline: string | null };
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="fullName" label="Full name" defaultValue={initial.fullName} required autoComplete="name" />
        <Field name="email" label="Email for applications" type="email" defaultValue={initial.email} required autoComplete="email" />
        <Field name="phone" label="Phone" type="tel" defaultValue={initial.phone} autoComplete="tel" />
        <Field name="location" label="City, State" defaultValue={initial.location} placeholder="Columbus, OH" autoComplete="address-level2" />
        <Field name="postalCode" label="ZIP / postal code" defaultValue={initial.postalCode} autoComplete="postal-code" />
        <Field name="headline" label="Headline" defaultValue={initial.headline} placeholder="e.g. ICU Registered Nurse" />
      </div>
      <ErrorText state={state} />
      <Button type="submit" size="lg" disabled={pending} className="h-10 self-end px-5">
        {pending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}

const QUICK_QUESTIONS = [
  { key: "work_authorization", prompt: "Are you legally authorized to work where you’re applying?" },
  { key: "needs_sponsorship", prompt: "Will you now or in the future need visa sponsorship?" },
  { key: "willing_to_relocate", prompt: "Are you open to relocating for the right role?" },
] as const;

export function QuickAnswersForm({ action, saved }: { action: Action; saved: Record<string, string | undefined> }) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  return (
    <form action={formAction} className="flex flex-col gap-6">
      {QUICK_QUESTIONS.map((question) => (
        <fieldset key={question.key} className="flex flex-col gap-2.5">
          <legend className="text-sm font-medium">{question.prompt}</legend>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["yes", "Yes"],
              ["no", "No"],
              ["", "Ask me each time"],
            ].map(([value, label]) => (
              <label
                key={label}
                className="flex cursor-pointer items-center justify-center rounded-lg border bg-background px-3 py-2.5 text-center text-sm transition-colors has-checked:border-primary has-checked:bg-accent has-checked:font-medium has-checked:text-accent-foreground"
              >
                <input
                  type="radio"
                  name={question.key}
                  value={value}
                  defaultChecked={(saved[question.key] ?? "") === value}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="start_date">How soon could you start?</Label>
        <Input id="start_date" name="start_date" defaultValue={saved.start_date ?? ""} placeholder="Within two weeks" className="h-10" />
      </div>
      <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
        Demographic questions (gender, race, veteran and disability status) default to “Decline to self-identify”. You can
        change any answer later in Preferences.
      </p>
      <ErrorText state={state} />
      <Button type="submit" size="lg" disabled={pending} className="h-10 self-end px-5">
        {pending ? "Finishing…" : "Finish and see my matches"}
      </Button>
    </form>
  );
}
