import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";

import { formatSalary, REMOTE_LABEL, scoreTone } from "./format";

export type JobPostingView = {
  title: string;
  company: string;
  location: string | null;
  remote: keyof typeof REMOTE_LABEL;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  description: string;
  score: number;
  reason: string;
  attribution: { label: string; url: string } | null;
};

export function JobPosting({ job }: { job: JobPostingView }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const meta = [job.location, REMOTE_LABEL[job.remote], salary].filter(Boolean);
  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
        <p className="text-muted-foreground">
          {job.company}
          {meta.length ? ` · ${meta.join(" · ")}` : ""}
        </p>
        <div className="flex items-start gap-3 rounded-xl bg-muted p-4">
          <span className={cn("rounded-md px-2 py-1 text-sm font-semibold", scoreTone(job.score))}>{job.score}% fit</span>
          <p className="text-sm">
            <span className="font-medium">Why it fits: </span>
            {job.reason}
          </p>
        </div>
        {job.attribution ? (
          <a href={job.attribution.url} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:underline">
            {job.attribution.label} <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        ) : null}
      </header>
      <div className="text-sm leading-relaxed whitespace-pre-line">{job.description}</div>
    </article>
  );
}
