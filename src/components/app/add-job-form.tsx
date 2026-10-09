"use client";

import { Link2, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";

import type { AddJobState } from "@/app/app/jobs/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/** Bring any posting: a link we can read, or the pasted text (LinkedIn, Indeed, PDFs…). */
export function AddJobForm({ action }: { action: (previous: AddJobState, formData: FormData) => Promise<AddJobState> }) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  const [mode, setMode] = useState<"link" | "text">("link");

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-medium">
          <Link2 className="size-4" aria-hidden="true" /> Add a job you found
        </h2>
        <button
          type="button"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "link" ? "text" : "link")}
        >
          {mode === "link" ? "Paste text instead" : "Use a link instead"}
        </button>
      </div>
      {mode === "link" ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="job-link" className="sr-only">
            Job posting link
          </label>
          <Input id="job-link" name="link" type="url" placeholder="https://jobs.lever.co/…" required className="sm:flex-1" />
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {pending ? "Reading…" : "Add job"}
          </Button>
        </div>
      ) : (
        <>
          <label htmlFor="job-text" className="sr-only">
            Job posting text
          </label>
          <Textarea id="job-text" name="text" rows={6} required placeholder="Paste the full job posting here…" />
          <Button type="submit" disabled={pending} className="self-end">
            {pending ? "Reading…" : "Add job"}
          </Button>
        </>
      )}
      <p aria-live="polite" className="min-h-5 text-sm text-destructive">
        {state.status === "error" ? state.message : ""}
      </p>
    </form>
  );
}
