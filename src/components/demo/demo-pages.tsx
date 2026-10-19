"use client";

import { ArrowRight, BellRing, Bookmark, Briefcase, MessagesSquare, Send } from "lucide-react";
import Link from "next/link";

import { ApplyPanel } from "@/components/app/apply-panel";
import { CompanyAvatar } from "@/components/app/company-avatar";
import { formatSalary } from "@/components/app/format";
import { JobFeed } from "@/components/app/job-feed";
import { JobDetailLayout } from "@/components/app/job-posting";
import { PageHeader } from "@/components/app/page-header";
import { ProfileEditor } from "@/components/app/profile-editor";
import { ScoreRing } from "@/components/app/score-ring";
import { TrackerBoard } from "@/components/app/tracker-board";
import { Button } from "@/components/ui/button";
import { DEMO_JOBS, DEMO_PROFILE } from "@/lib/demo/fixtures";

import { useDemo } from "./demo-provider";

function Stat({ icon: Icon, label, value, href }: { icon: typeof Briefcase; label: string; value: number; href: string }) {
  return (
    <Link href={href} className="surface flex items-center gap-4 p-5 transition-shadow hover:shadow-md">
      <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Link>
  );
}

export function DemoOverview() {
  const demo = useDemo();
  const top = demo.feed.filter((item) => item.status === "new").slice(0, 4);
  const followUps = demo.applications.filter((app) => app.status === "applied" && app.followUpAt && app.followUpAt.toISOString() <= demo.now);
  const count = (status: string) => demo.applications.filter((app) => app.status === status).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Welcome back, Maya"
        description="A sample ICU nurse’s workspace. Save or skip jobs, tailor an application, move cards on the tracker."
        actions={
          <Button asChild>
            <Link href="/demo/jobs">
              Browse matches <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Briefcase} label="New matches" value={demo.feed.filter((item) => item.status === "new").length} href="/demo/jobs" />
        <Stat icon={Bookmark} label="Drafts in progress" value={count("saved")} href="/demo/tracker" />
        <Stat icon={Send} label="Applied" value={count("applied")} href="/demo/tracker" />
        <Stat icon={MessagesSquare} label="Interviews" value={count("interview")} href="/demo/tracker" />
      </div>
      {followUps.length ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="flex items-center gap-2 font-medium text-amber-900">
            <BellRing className="size-4" aria-hidden="true" /> Time to follow up
          </h2>
          {followUps.map((app) => {
            const job = DEMO_JOBS.find((item) => item.jobId === app.jobId)!;
            return (
              <Link key={app.id} href={`/demo/jobs/${job.jobId}`} className="flex items-center gap-3 text-sm hover:underline">
                <CompanyAvatar name={job.company} size="sm" />
                {job.title} at {job.company}
              </Link>
            );
          })}
        </section>
      ) : null}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Top new matches</h2>
          <Link href="/demo/jobs" className="text-sm text-primary hover:underline">
            See all
          </Link>
        </div>
        <ul className="flex flex-col gap-3">
          {top.map((item) => (
            <li key={item.jobId}>
              <Link href={`/demo/jobs/${item.jobId}`} className="surface flex items-center gap-4 p-4 transition-shadow hover:shadow-md">
                <CompanyAvatar name={item.company} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {[item.company, item.location, formatSalary(item.salaryMin, item.salaryMax, item.salaryCurrency)].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm">{item.reason}</p>
                </div>
                <ScoreRing score={item.score} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function DemoJobs() {
  const demo = useDemo();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Jobs for Maya" description="Scored against her profile, best fits first. Anything marked “Not for me” stays hidden." />
      <JobFeed items={demo.feed} basePath="/demo/jobs" onStatusChange={demo.setMatchStatus} />
    </div>
  );
}

export function DemoJob({ jobId }: { jobId: string }) {
  const demo = useDemo();
  const job = DEMO_JOBS.find((item) => item.jobId === jobId);
  const item = demo.feed.find((entry) => entry.jobId === jobId);
  if (!job || !item) return <p>That sample job doesn’t exist.</p>;
  const application = demo.applications.find((app) => app.jobId === jobId) ?? null;

  return (
    <JobDetailLayout
      job={{ ...item, description: job.description }}
      panel={
        <ApplyPanel
          applyUrl={null}
          application={application}
          usage={{ remaining: Math.max(0, demo.limit - demo.used) }}
          pdfHref={application ? `/demo/cover-letter/${jobId}` : null}
          upgradeHref="/#pricing"
          actions={{
            tailor: () => demo.tailor(jobId),
            updateAnswer: (answerId, answer) => demo.updateAnswer(jobId, answerId, answer),
            saveCoverLetter: (letter) => demo.saveCoverLetter(jobId, letter),
            setStatus: (status) => demo.setApplicationStatus(jobId, status),
          }}
        />
      }
    />
  );
}

export function DemoTracker() {
  const demo = useDemo();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Tracker" description="Move a card by changing its status." />
      <TrackerBoard
        basePath="/demo/jobs"
        today={demo.now}
        onStatusChange={(applicationId, status) => demo.setApplicationStatus(applicationId.replace(/^demo-/, ""), status)}
        items={demo.applications.map((app) => {
          const job = DEMO_JOBS.find((entry) => entry.jobId === app.jobId)!;
          return {
            applicationId: app.id,
            jobId: app.jobId,
            status: app.status,
            title: job.title,
            company: job.company,
            appliedAt: app.appliedAt?.toISOString() ?? null,
            followUpAt: app.followUpAt?.toISOString() ?? null,
          };
        })}
      />
    </div>
  );
}

export function DemoProfile() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Maya’s profile"
        description="Parsed from her resume, then reviewed. Every draft cites only what’s here. (Read-only in the demo.)"
      />
      <ProfileEditor initial={DEMO_PROFILE} readOnly onSave={async () => ({ ok: true })} />
    </div>
  );
}
