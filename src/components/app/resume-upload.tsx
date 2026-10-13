"use client";

import { CheckCircle2, FileText, Loader2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import type { UploadState } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Drop zone for a PDF/DOCX resume. The native file input covers the whole zone, so dragging a
 * file onto it works without extra JS. With `nextHref`, success moves on (onboarding).
 */
export function ResumeUpload({
  action,
  currentFilename,
  nextHref,
}: {
  action: (previous: UploadState, formData: FormData) => Promise<UploadState>;
  currentFilename: string | null;
  nextHref?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  const [chosen, setChosen] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "done" && nextHref) router.push(nextHref);
  }, [state.status, nextHref, router]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-background px-6 py-10 text-center transition-colors",
          chosen ? "border-primary/50 bg-accent/40" : "hover:border-primary/40 hover:bg-muted/50",
          pending && "pointer-events-none opacity-70",
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          {pending ? (
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          ) : chosen ? (
            <FileText className="size-6" aria-hidden="true" />
          ) : (
            <UploadCloud className="size-6" aria-hidden="true" />
          )}
        </span>
        <div>
          <p className="font-medium">
            {pending ? "Reading your resume…" : chosen ? chosen : currentFilename ? "Drop a new resume to replace it" : "Drop your resume here"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {pending
              ? "This takes about 20 seconds."
              : chosen
                ? "Ready to upload."
                : currentFilename
                  ? `Current file: ${currentFilename}`
                  : "or click to choose a PDF or Word file (up to 4 MB)"}
          </p>
        </div>
        <label htmlFor="resume" className="sr-only">
          Resume file
        </label>
        <input
          id="resume"
          name="resume"
          type="file"
          required
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => setChosen(event.target.files?.[0]?.name ?? null)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm">
          {state.status === "error" ? <span className="text-destructive">{state.message}</span> : null}
          {state.status === "done" && !nextHref ? (
            <span className="inline-flex items-center gap-1.5 text-primary">
              <CheckCircle2 className="size-4" aria-hidden="true" /> Done. Review what we found below.
            </span>
          ) : null}
        </p>
        <Button type="submit" disabled={pending || !chosen} className="ml-auto">
          {pending ? "Reading…" : "Upload and read my resume"}
        </Button>
      </div>
    </form>
  );
}
