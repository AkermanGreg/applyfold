import { notFound } from "next/navigation";

import { ApplyPanel } from "@/components/app/apply-panel";
import { JobPosting } from "@/components/app/job-posting";
import { getApplicationForJob } from "@/lib/applications";
import { requireUserId } from "@/lib/auth";
import { getJobForUser, toFeedItem } from "@/lib/feed";
import { currentUsage, monthlyLimit } from "@/lib/usage";
import { effectivePlan, ensureUser } from "@/lib/users";

import { saveCoverLetterAction, setApplicationStatusAction, tailorAction, updateAnswerAction } from "./actions";

// Drafting takes ~30s on Opus; leave headroom.
export const maxDuration = 120;

export default async function JobPage({ params }: PageProps<"/app/jobs/[id]">) {
  const userId = await requireUserId();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [row, application, user] = await Promise.all([
    getJobForUser(userId, id),
    getApplicationForJob(userId, id),
    ensureUser(userId),
  ]);
  if (!row) notFound();
  const item = toFeedItem(row.match, row.job);
  const plan = effectivePlan(user);
  const used = await currentUsage(userId, "tailored_application");

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      <JobPosting job={{ ...item, description: row.job.description }} />
      <ApplyPanel
        applyUrl={row.job.applyUrl}
        application={application}
        usage={{ used, limit: monthlyLimit(plan, "tailored_application") }}
        pdfHref={application ? `/app/applications/${application.id}/cover-letter` : null}
        actions={{
          tailor: tailorAction.bind(null, id),
          updateAnswer: updateAnswerAction,
          saveCoverLetter: async (letter) => {
            "use server";
            if (application) await saveCoverLetterAction(application.id, letter);
          },
          setStatus: async (status) => {
            "use server";
            if (application) await setApplicationStatusAction(application.id, status);
          },
        }}
      />
    </div>
  );
}
