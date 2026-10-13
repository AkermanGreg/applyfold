import { ExternalLink, MapPin, Sparkles, Wallet } from "lucide-react";

import { CompanyAvatar } from "./company-avatar";
import { formatSalary, REMOTE_LABEL } from "./format";
import { Chip } from "./job-feed";
import { ScoreRing, scoreLabel } from "./score-ring";

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

/**
 * Job detail layout. DOM order is header → apply panel → description, so on narrow screens the
 * panel sits right under the title; from xl up the panel moves to a sticky right column.
 */
export function JobDetailLayout({ job, panel }: { job: JobPostingView; panel: React.ReactNode }) {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0 xl:col-start-1">
        <JobHeader job={job} />
      </div>
      <div className="xl:sticky xl:top-8 xl:col-start-2 xl:row-span-2 xl:row-start-1">{panel}</div>
      <div className="min-w-0 xl:col-start-1">
        <JobDescription description={job.description} />
      </div>
    </div>
  );
}

function JobHeader({ job }: { job: JobPostingView }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const remote = REMOTE_LABEL[job.remote];
  return (
      <header className="surface p-6">
        <div className="flex items-start gap-4">
          <CompanyAvatar name={job.company} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{job.title}</h1>
            <p className="text-muted-foreground">{job.company}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.location ? <Chip icon={MapPin}>{job.location}</Chip> : null}
              {remote ? <Chip>{remote}</Chip> : null}
              {salary ? <Chip icon={Wallet}>{salary}</Chip> : null}
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-4 rounded-xl bg-accent/60 p-4">
          <ScoreRing score={job.score} size={56} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-accent-foreground">{scoreLabel(job.score)}</p>
            <p className="mt-0.5 flex gap-1.5 text-sm">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{job.reason}</span>
            </p>
          </div>
        </div>
        {job.attribution ? (
          <a href={job.attribution.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline">
            {job.attribution.label} <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        ) : null}
      </header>
  );
}

function JobDescription({ description }: { description: string }) {
  return (
    <section className="surface p-6" aria-labelledby="posting-heading">
      <h2 id="posting-heading" className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        About the role
      </h2>
      <div className="mt-4 max-w-prose text-[15px] leading-relaxed whitespace-pre-line">{description}</div>
    </section>
  );
}
