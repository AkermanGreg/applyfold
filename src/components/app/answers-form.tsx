"use client";

import { useActionState } from "react";

import type { FormState } from "@/app/actions/preferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SavedAnswers } from "@/lib/answers/resolve";
import { STANDARD_QUESTIONS, type StandardQuestion } from "@/lib/answers/standard";

const GROUPS: { id: StandardQuestion["group"]; title: string; note?: string }[] = [
  { id: "eligibility", title: "Eligibility" },
  { id: "availability", title: "Availability" },
  { id: "logistics", title: "Logistics" },
  {
    id: "eeo",
    title: "Voluntary demographic questions",
    note: "These default to “Decline to self-identify”. Change them only if you want to share.",
  },
];

function QuestionInput({ question, value }: { question: StandardQuestion; value: string | undefined }) {
  const id = `answer-${question.key}`;
  if (question.kind === "yes_no") {
    return (
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm">{question.prompt}</legend>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["yes", "Yes"],
            ["no", "No"],
            ["", "Ask me"],
          ].map(([optionValue, label]) => (
            <label
              key={label}
              className="flex cursor-pointer items-center justify-center rounded-lg border bg-background px-2 py-2 text-sm transition-colors has-checked:border-primary has-checked:bg-accent has-checked:font-medium has-checked:text-accent-foreground"
            >
              <input type="radio" name={question.key} value={optionValue} defaultChecked={(value ?? "") === optionValue} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }
  if (question.kind === "eeo") {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm">
          {question.prompt}
        </label>
        <Input id={id} name={question.key} defaultValue={value === "decline" || !value ? "decline" : value} />
        <p className="text-xs text-muted-foreground">Type “decline” or your answer exactly as you’d like it given.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm">
        {question.prompt}
      </label>
      <Input id={id} name={question.key} defaultValue={value ?? ""} />
      {question.help ? <p className="text-xs text-muted-foreground">{question.help}</p> : null}
    </div>
  );
}

/** Answer the screening questions once; every application reuses them. */
export function AnswersForm({
  saved,
  action,
}: {
  saved: SavedAnswers;
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {GROUPS.map((group) => (
        <section key={group.id} className="flex flex-col gap-4">
          <div className="border-b pb-2">
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{group.title}</h3>
            {group.note ? <p className="text-sm text-muted-foreground">{group.note}</p> : null}
          </div>
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {STANDARD_QUESTIONS.filter((question) => question.group === group.id).map((question) => (
              <QuestionInput key={question.key} question={question} value={saved[question.key]} />
            ))}
          </div>
        </section>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save answers"}
        </Button>
        <p aria-live="polite" className="text-sm text-primary">
          {state.status === "saved" ? state.message : ""}
        </p>
      </div>
    </form>
  );
}
