import Link from "next/link";

import { addJobAction, refreshMatchesAction, setMatchStatusAction } from "@/app/actions/jobs";
import { AddJobForm } from "@/components/app/add-job-form";
import { JobFeed } from "@/components/app/job-feed";
import { MatchesWarmingUp } from "@/components/app/matches-warming-up";
import { PageHeader } from "@/components/app/page-header";
import { RefreshMatches } from "@/components/app/refresh-matches";
import { getFeed } from "@/lib/feed";
import { getPreferences } from "@/lib/preferences-store";
import { requireAppUser } from "@/lib/session";

export const metadata = { title: "Jobs" };
export const maxDuration = 120;

export default async function JobsPage({ searchParams }: PageProps<"/app/jobs">) {
  const { userId } = await requireAppUser();
  const [items, preferences, params] = await Promise.all([getFeed(userId), getPreferences(userId), searchParams]);
  const welcome = params.welcome === "1";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Jobs for you"
        description="Scored against your profile, best fits first. Anything you mark “Not for me” stays hidden."
        actions={preferences ? <RefreshMatches action={refreshMatchesAction} /> : null}
      />
      {welcome ? <MatchesWarmingUp waiting={items.length === 0} /> : null}
      <JobFeed
        items={items}
        basePath="/app/jobs"
        onStatusChange={setMatchStatusAction}
        emptyState={
          preferences ? (
            "No new matches yet. New jobs arrive every morning, or add one you found below."
          ) : (
            <>
              Tell us what you’re looking for to start getting matches.{" "}
              <Link href="/app/preferences" className="font-medium text-primary underline">
                Set preferences
              </Link>
            </>
          )
        }
      />
      <AddJobForm action={addJobAction} />
    </div>
  );
}
