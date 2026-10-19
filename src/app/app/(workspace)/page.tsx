import { ArrowRight, BellRing, Bookmark, Briefcase, CheckCircle2, Circle, MessagesSquare, Send, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { CompanyAvatar } from "@/components/app/company-avatar";
import { formatSalary } from "@/components/app/format";
import { PageHeader } from "@/components/app/page-header";
import { ScoreRing } from "@/components/app/score-ring";
import { Button } from "@/components/ui/button";
import { listApplications } from "@/lib/applications";
import { isAdminEmail } from "@/lib/admin";
import { getSavedAnswers } from "@/lib/answers/store";
import { getFeed } from "@/lib/feed";
import { getPreferences } from "@/lib/preferences-store";
import { getProfileRecord } from "@/lib/profile/store";
import { requireOnboardedUser } from "@/lib/session";

export const metadata = { title: "Overview" };

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

export default async function OverviewPage() {
  const { userId, user } = await requireOnboardedUser();
  const [{ profile }, preferences, saved, feed, applications] = await Promise.all([
    getProfileRecord(userId),
    getPreferences(userId),
    getSavedAnswers(userId),
    getFeed(userId),
    listApplications(userId),
  ]);
  const firstName = profile?.contact.fullName?.split(" ")[0];
  const now = new Date();

  const steps = [
    { done: Boolean(profile?.experience.length), label: "Add your resume", href: "/app/profile" },
    { done: Boolean(preferences), label: "Tell us what you’re looking for", href: "/app/preferences" },
    { done: Object.keys(saved).length >= 3, label: "Answer the screening questions", href: "/app/preferences" },
    { done: applications.length > 0, label: "Tailor your first application", href: "/app/jobs" },
  ];
  const setupDone = steps.filter((step) => step.done).length;
  const topMatches = feed.filter((item) => item.status === "new").slice(0, 4);
  const followUps = applications.filter((item) => item.status === "applied" && item.followUpAt && item.followUpAt <= now);
  const count = (status: string) => applications.filter((item) => item.status === status).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Welcome back${firstName ? `, ${firstName}` : ""}`}
        description="Here’s where your search stands today."
        actions={
          <>
            {isAdminEmail(user.email) ? (
              <Button asChild variant="outline">
                <Link href="/app/admin">
                  <ShieldCheck aria-hidden="true" /> Admin
                </Link>
              </Button>
            ) : null}
            <Button asChild>
              <Link href="/app/jobs">
                Browse matches <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Briefcase} label="New matches" value={feed.filter((item) => item.status === "new").length} href="/app/jobs" />
        <Stat icon={Bookmark} label="Drafts in progress" value={count("saved")} href="/app/tracker" />
        <Stat icon={Send} label="Applied" value={count("applied")} href="/app/tracker" />
        <Stat icon={MessagesSquare} label="Interviews" value={count("interview")} href="/app/tracker" />
      </div>

      {followUps.length ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="flex items-center gap-2 font-medium text-amber-900">
            <BellRing className="size-4" aria-hidden="true" /> Time to follow up
          </h2>
          <ul className="flex flex-col gap-2">
            {followUps.map((item) => (
              <li key={item.applicationId}>
                <Link href={`/app/jobs/${item.jobId}`} className="flex items-center gap-3 text-sm hover:underline">
                  <CompanyAvatar name={item.company} size="sm" />
                  {item.title} at {item.company}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Top new matches</h2>
            <Link href="/app/jobs" className="text-sm text-primary hover:underline">
              See all
            </Link>
          </div>
          {topMatches.length ? (
            <ul className="flex flex-col gap-3">
              {topMatches.map((item) => (
                <li key={item.jobId}>
                  <Link href={`/app/jobs/${item.jobId}`} className="surface flex items-center gap-4 p-4 transition-shadow hover:shadow-md">
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
          ) : (
            <div className="rounded-2xl border border-dashed bg-background p-8 text-center text-sm text-muted-foreground">
              {preferences ? "We’re scoring jobs for you. New matches arrive daily." : "Set your preferences to start getting matches."}
            </div>
          )}
        </section>

        <section className="surface h-fit p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Your setup</h2>
            <span className="text-sm text-muted-foreground tabular-nums">
              {setupDone}/{steps.length}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(setupDone / steps.length) * 100}%` }} />
          </div>
          <ol className="mt-4 flex flex-col gap-3 text-sm">
            {steps.map((step) => (
              <li key={step.label} className="flex items-center gap-2.5">
                {step.done ? (
                  <CheckCircle2 className="size-4.5 shrink-0 text-primary" aria-label="Done" />
                ) : (
                  <Circle className="size-4.5 shrink-0 text-muted-foreground" aria-label="To do" />
                )}
                {step.done ? (
                  <span className="text-muted-foreground">{step.label}</span>
                ) : (
                  <Link href={step.href} className="font-medium hover:underline">
                    {step.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
