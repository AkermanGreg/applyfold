import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { isAuthConfigured } from "@/lib/auth-config";
import { decryptJson } from "@/lib/crypto";
import { getProfileRecord } from "@/lib/profile/store";
import { type CoverLetter, renderCoverLetterPdf } from "@/lib/tailor/pdf";

/** Streams the cover letter as a PDF, rendered on demand from the user's latest edits. */
export async function GET(_request: Request, context: RouteContext<"/app/applications/[id]/cover-letter">) {
  const { userId } = isAuthConfigured ? await auth() : { userId: null };
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });

  const [row] = await db()
    .select({ application: schema.applications, job: schema.jobs })
    .from(schema.applications)
    .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
    .where(and(eq(schema.applications.id, id), eq(schema.applications.userId, userId)));
  if (!row?.application.coverLetterEnc) return new Response("Not found", { status: 404 });

  const { profile } = await getProfileRecord(userId);
  const bytes = await renderCoverLetterPdf({
    letter: decryptJson<CoverLetter>(row.application.coverLetterEnc),
    candidate: {
      name: profile?.contact.fullName ?? null,
      email: profile?.contact.email ?? null,
      phone: profile?.contact.phone ?? null,
      location: profile?.contact.location ?? null,
    },
    company: row.job.company,
    date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  });

  const filename = `Cover letter - ${row.job.company}`.replace(/[^\w .-]/g, "").slice(0, 80);
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
