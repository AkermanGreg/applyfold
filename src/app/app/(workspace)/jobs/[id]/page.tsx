import { notFound } from "next/navigation";

import { ApplyPanel } from "@/components/app/apply-panel";
import { JobDetailLayout } from "@/components/app/job-posting";
import { getApplicationForJob } from "@/lib/applications";
import { getJobForUser, toFeedItem } from "@/lib/feed";
import { requireAppUser } from "@/lib/session";
import { creditSummary } from "@/lib/usage";

import { saveCoverLetterAction, setApplicationStatusAction, tailorAction, updateAnswerAction } from "@/app/actions/application";

// Drafting takes ~30s on Opus; leave headroom.
export const maxDuration = 120;

export default async function JobPage({ params }: PageProps<"/app/jobs/[id]">) {
  const { userId, entitlement } = await requireAppUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [row, application, credits] = await Promise.all([
    getJobForUser(userId, id),
    getApplicationForJob(userId, id),
    creditSummary(userId, entitlement, "tailored_application"),
  ]);
  if (!row) notFound();
  const item = toFeedItem(row.match, row.job);

  return (
    <JobDetailLayout
      job={{ ...item, description: row.job.description }}
      panel={
        <ApplyPanel
          applyUrl={row.job.applyUrl}
          application={application}
          usage={{ remaining: credits.remaining, bonus: credits.bonus }}
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
      }
    />
  );
}
