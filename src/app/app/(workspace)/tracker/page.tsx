import { PageHeader } from "@/components/app/page-header";
import { TrackerBoard } from "@/components/app/tracker-board";
import { listApplications } from "@/lib/applications";
import { requireUserId } from "@/lib/auth";

import { setApplicationStatusAction } from "@/app/actions/application";

export const metadata = { title: "Tracker" };

export default async function TrackerPage() {
  const userId = await requireUserId();
  const applications = await listApplications(userId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Tracker" description="Every application in one place. We nudge you to follow up a week after you apply." />
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
