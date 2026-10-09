import { TrackerBoard } from "@/components/app/tracker-board";
import { listApplications } from "@/lib/applications";
import { requireUserId } from "@/lib/auth";

import { setApplicationStatusAction } from "../jobs/[id]/actions";

export const metadata = { title: "Tracker" };

export default async function TrackerPage() {
  const userId = await requireUserId();
  const applications = await listApplications(userId);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Tracker</h1>
        <p className="mt-1 text-muted-foreground">Every application in one place. We nudge you to follow up a week after applying.</p>
      </header>
      <TrackerBoard
        basePath="/app/jobs"
        today={new Date().toISOString()}
        onStatusChange={setApplicationStatusAction}
        items={applications.map((item) => ({
          ...item,
          appliedAt: item.appliedAt?.toISOString() ?? null,
          followUpAt: item.followUpAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
