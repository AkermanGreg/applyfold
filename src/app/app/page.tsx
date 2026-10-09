import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

import { formatSalary, scoreTone } from "@/components/app/format";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { listApplications } from "@/lib/applications";
import { getSavedAnswers } from "@/lib/answers/store";
import { requireUserId } from "@/lib/auth";
import { getFeed } from "@/lib/feed";
import { PLANS } from "@/lib/plans";
import { getPreferences } from "@/lib/preferences-store";
import { getProfileRecord } from "@/lib/profile/store";
import { currentUsage, monthlyLimit } from "@/lib/usage";
import { effectivePlan, ensureUser } from "@/lib/users";
import { cn } from "@/lib/utils";

export const metadata = { title: "Overview" };

export default async function OverviewPage() {
  const userId = await requireUserId();
  const user = await ensureUser(userId);
  const [{ profile }, preferences, saved, feed, applications, used] = await Promise.all([
    getProfileRecord(userId),
    getPreferences(userId),
    getSavedAnswers(userId),
    getFeed(userId),
    listApplications(userId),
    currentUsage(userId, "tailored_application"),
  ]);
  const plan = effectivePlan(user);
  const limit = monthlyLimit(plan, "tailored_application");
  const firstName = profile?.contact.fullName?.split(" ")[0];

  const steps = [
    { done: Boolean(profile), label: "Upload your resume", href: "/app/profile" },
    { done: Boolean(preferences), label: "Tell us what you’re looking for", href: "/app/preferences" },
    { done: Object.keys(saved).length >= 3, label: "Answer the screening questions once", href: "/app/preferences" },
    { done: applications.length > 0, label: "Tailor your first application", href: "/app/jobs" },
  ];
  const now = new Date();
  const topMatches = feed.filter((item) => item.status === "new").slice(0, 3);
  const followUps = applications.filter((item) => item.status === "applied" && item.followUpAt && item.followUpAt <= now);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome{firstName ? `, ${firstName}` : ""}.</h1>
        <p className="mt-1 text-muted-foreground">Here’s where your search stands.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border p-5 lg:col-span-2">
          <h2 className="font-medium">Get set up</h2>
          <ol className="mt-4 flex flex-col gap-3">
            {steps.map((step) => (
              <li key={step.label} className="flex items-center gap-3">
                {step.done ? (
                  <CheckCircle2 className="size-5 text-primary" aria-label="Done" />
                ) : (
                  <Circle className="size-5 text-muted-foreground" aria-label="To do" />
                )}
                {step.done ? (
                  <span className="text-muted-foreground line-through">{step.label}</span>
                ) : (
                  <Link href={step.href} className="hover:underline">
                    {step.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </section>
        <section className="flex flex-col gap-3 rounded-xl border p-5">
          <h2 className="font-medium">{PLANS[plan].name} plan</h2>
          <p className="text-sm text-muted-foreground">
            {Math.max(0, limit - used)} of {limit} tailored applications left this month
          </p>
          <Progress value={Math.min(100, (used / Math.max(1, limit)) * 100)} aria-label="Tailored applications used" />
          {plan === "free" ? (
            <Button asChild variant="outline" size="sm" className="mt-auto w-fit">
              <Link href="/#pricing">See Pro</Link>
            </Button>
          ) : null}
        </section>
      </div>

      {followUps.length ? (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="font-medium text-amber-900">Time to follow up</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {followUps.map((item) => (
              <li key={item.applicationId}>
                <Link href={`/app/jobs/${item.jobId}`} className="underline">
                  {item.title} at {item.company}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Top new matches</h2>
          <Link href="/app/jobs" className="text-sm text-primary hover:underline">
            See all
          </Link>
        </div>
        {topMatches.length ? (
          <ul className="grid gap-3 md:grid-cols-3">
            {topMatches.map((item) => (
              <li key={item.jobId} className="flex flex-col gap-2 rounded-xl border p-4">
                <span className={cn("w-fit rounded-md px-2 py-0.5 text-xs font-semibold", scoreTone(item.score))}>
                  {item.score}% fit
                </span>
                <Link href={`/app/jobs/${item.jobId}`} className="font-medium hover:underline">
                  {item.title}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {[item.company, formatSalary(item.salaryMin, item.salaryMax, item.salaryCurrency)].filter(Boolean).join(" · ")}
                </p>
                <p className="text-sm">{item.reason}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {preferences ? "No new matches right now. New jobs arrive daily." : "Set your preferences to start getting matches."}
          </p>
        )}
      </section>
    </div>
  );
}
