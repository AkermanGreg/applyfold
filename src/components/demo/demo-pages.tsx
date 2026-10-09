"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { ApplyPanel } from "@/components/app/apply-panel";
import { formatSalary, scoreTone } from "@/components/app/format";
import { JobFeed } from "@/components/app/job-feed";
import { JobPosting } from "@/components/app/job-posting";
import { ProfileEditor } from "@/components/app/profile-editor";
import { TrackerBoard } from "@/components/app/tracker-board";
import { Progress } from "@/components/ui/progress";
import { DEMO_JOBS, DEMO_PROFILE } from "@/lib/demo/fixtures";
import { cn } from "@/lib/utils";

import { useDemo } from "./demo-provider";

export function DemoOverview() {
  const demo = useDemo();
  const top = demo.feed.filter((item) => item.status === "new").slice(0, 3);
  const followUps = demo.applications.filter((app) => app.status === "applied" && app.followUpAt && app.followUpAt.toISOString() <= demo.now);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, Maya.</h1>
        <p className="mt-1 text-muted-foreground">
          This is the workspace of a sample ICU nurse. Click around: save or skip jobs, tailor an application, move cards
          on the tracker.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border p-5 lg:col-span-2">
          <h2 className="font-medium">Set up</h2>
          <ul className="mt-4 flex flex-col gap-3 text-muted-foreground">
            {["Resume parsed into a profile", "Preferences: ICU / critical care RN, Columbus OH", "Screening answers saved once"].map(
              (label) => (
                <li key={label} className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-primary" aria-hidden="true" /> {label}
                </li>
              ),
            )}
          </ul>
        </section>
        <section className="flex flex-col gap-3 rounded-xl border p-5">
          <h2 className="font-medium">Free plan</h2>
          <p className="text-sm text-muted-foreground">
            {demo.limit - demo.used} of {demo.limit} tailored applications left this month
          </p>
          <Progress value={(demo.used / demo.limit) * 100} aria-label="Tailored applications used" />
        </section>
      </div>
      {followUps.length ? (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm">
          <h2 className="font-medium text-amber-900">Time to follow up</h2>
          {followUps.map((app) => {
            const job = DEMO_JOBS.find((item) => item.jobId === app.jobId)!;
            return (
              <p key={app.id} className="mt-1">
                <Link href={`/demo/jobs/${job.jobId}`} className="underline">
                  {job.title} at {job.company}
                </Link>
              </p>
            );
          })}
        </section>
      ) : null}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Top new matches</h2>
          <Link href="/demo/jobs" className="text-sm text-primary hover:underline">
            See all
          </Link>
        </div>
        <ul className="grid gap-3 md:grid-cols-3">
          {top.map((item) => (
            <li key={item.jobId} className="flex flex-col gap-2 rounded-xl border p-4">
              <span className={cn("w-fit rounded-md px-2 py-0.5 text-xs font-semibold", scoreTone(item.score))}>{item.score}% fit</span>
              <Link href={`/demo/jobs/${item.jobId}`} className="font-medium hover:underline">
                {item.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                {[item.company, formatSalary(item.salaryMin, item.salaryMax, item.salaryCurrency)].filter(Boolean).join(" · ")}
              </p>
              <p className="text-sm">{item.reason}</p>
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
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Jobs for Maya</h1>
        <p className="mt-1 text-muted-foreground">Scored against her profile. Skipped jobs stay skipped.</p>
      </header>
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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      <JobPosting job={{ ...item, description: job.description }} />
      <ApplyPanel
        applyUrl={null}
        application={application}
        usage={{ used: demo.used, limit: demo.limit }}
        pdfHref={application ? `/demo/cover-letter/${jobId}` : null}
        upgradeHref="/#pricing"
        actions={{
          tailor: () => demo.tailor(jobId),
          updateAnswer: (answerId, answer) => demo.updateAnswer(jobId, answerId, answer),
          saveCoverLetter: (letter) => demo.saveCoverLetter(jobId, letter),
          setStatus: (status) => demo.setApplicationStatus(jobId, status),
        }}
      />
    </div>
  );
}

export function DemoTracker() {
  const demo = useDemo();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Tracker</h1>
        <p className="mt-1 text-muted-foreground">Move a card by changing its status.</p>
      </header>
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
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Maya’s profile</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Parsed from her resume, then reviewed. Every draft cites only what’s here. (Read-only in the demo.)
        </p>
      </header>
      <ProfileEditor initial={DEMO_PROFILE} readOnly onSave={async () => ({ ok: true })} />
    </div>
  );
}
