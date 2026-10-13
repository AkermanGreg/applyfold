import { PageHeader } from "@/components/app/page-header";
import { ProfileEditor } from "@/components/app/profile-editor";
import { ResumeUpload } from "@/components/app/resume-upload";
import { requireUserId } from "@/lib/auth";
import { emptyProfile } from "@/lib/profile/schema";
import { getProfileRecord } from "@/lib/profile/store";

import { saveProfileAction, uploadResume } from "@/app/actions/profile";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const userId = await requireUserId();
  const record = await getProfileRecord(userId);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Your profile"
        description="Every draft uses only what’s here. Fix anything we got wrong and add what’s missing: the assistant never fills gaps by guessing."
      />
      <section className="surface p-6">
        <h2 className="mb-4 font-semibold">Resume</h2>
        <ResumeUpload action={uploadResume} currentFilename={record.resumeFilename} />
      </section>
      {/* Re-mount the editor when a new parse lands so it picks up the fresh profile. */}
      <ProfileEditor
        key={record.parsedAt?.toISOString() ?? "manual"}
        initial={record.profile ?? emptyProfile()}
        onSave={saveProfileAction}
      />
    </div>
  );
}
