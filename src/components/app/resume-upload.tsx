"use client";

import { FileUp, Loader2 } from "lucide-react";
import { useActionState } from "react";

import type { UploadState } from "@/app/app/profile/actions";
import { Button } from "@/components/ui/button";

export function ResumeUpload({
  action,
  currentFilename,
}: {
  action: (previous: UploadState, formData: FormData) => Promise<UploadState>;
  currentFilename: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });

  return (
    <form action={formAction} className="rounded-xl border border-dashed p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-medium">{currentFilename ? "Replace your resume" : "Upload your resume"}</h2>
          <p className="text-sm text-muted-foreground">
            {currentFilename
              ? `Current file: ${currentFilename}. Uploading again rebuilds your profile.`
              : "PDF or Word, up to 4 MB. We’ll turn it into a profile you can review."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <label className="sr-only" htmlFor="resume">
            Resume file
          </label>
          <input
            id="resume"
            name="resume"
            type="file"
            required
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="text-sm file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5 file:text-sm"
          />
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <FileUp aria-hidden="true" />}
            {pending ? "Reading your resume…" : "Upload and parse"}
          </Button>
        </div>
      </div>
      <p aria-live="polite" className="mt-3 min-h-5 text-sm">
        {state.status === "error" ? <span className="text-destructive">{state.message}</span> : null}
        {state.status === "done" ? <span className="text-primary">Done. Review your profile below.</span> : null}
      </p>
    </form>
  );
}
