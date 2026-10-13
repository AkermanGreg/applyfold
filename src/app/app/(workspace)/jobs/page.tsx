import Link from "next/link";

import { AddJobForm } from "@/components/app/add-job-form";
import { JobFeed } from "@/components/app/job-feed";
import { RefreshMatches } from "@/components/app/refresh-matches";
import { requireUserId } from "@/lib/auth";
import { getFeed } from "@/lib/feed";
import { getPreferences } from "@/lib/preferences-store";

import { addJobAction, refreshMatchesAction, setMatchStatusAction } from "./actions";

export const metadata = { title: "Jobs" };
export const maxDuration = 120;

export default async function JobsPage() {
  const userId = await requireUserId();
  const [items, preferences] = await Promise.all([getFeed(userId), getPreferences(userId)]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs for you</h1>
          <p className="mt-1 text-muted-foreground">Scored against your profile. Skipped jobs stay skipped.</p>
        </div>
        {preferences ? <RefreshMatches action={refreshMatchesAction} /> : null}
      </header>
      <AddJobForm action={addJobAction} />
      <JobFeed
        items={items}
        basePath="/app/jobs"
        onStatusChange={setMatchStatusAction}
        emptyState={
          preferences ? (
            "No new matches yet. New jobs arrive daily, or add one you found above."
          ) : (
            <>
              Tell us what you’re looking for to start getting matches.{" "}
              <Link href="/app/preferences" className="text-primary underline">
                Set preferences
              </Link>
            </>
          )
        }
      />
    </div>
  );
}
