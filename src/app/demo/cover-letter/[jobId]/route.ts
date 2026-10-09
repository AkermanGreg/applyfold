import { DEMO_DRAFTS, DEMO_JOBS, DEMO_PROFILE } from "@/lib/demo/fixtures";
import { renderCoverLetterPdf } from "@/lib/tailor/pdf";

/** Sample PDF built from the demo fixtures: same renderer as real users, no auth, no AI. */
export async function GET(_request: Request, context: RouteContext<"/demo/cover-letter/[jobId]">) {
  const { jobId } = await context.params;
  const draft = DEMO_DRAFTS[jobId];
  const job = DEMO_JOBS.find((item) => item.jobId === jobId);
  if (!draft?.coverLetter || !job) return new Response("Not found", { status: 404 });

  const bytes = await renderCoverLetterPdf({
    letter: draft.coverLetter,
    candidate: {
      name: DEMO_PROFILE.contact.fullName,
      email: DEMO_PROFILE.contact.email,
      phone: DEMO_PROFILE.contact.phone,
      location: DEMO_PROFILE.contact.location,
    },
    company: job.company,
    date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  });
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Sample cover letter - ${job.company}.pdf"`,
    },
  });
}
