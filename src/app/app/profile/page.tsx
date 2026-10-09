import { ProfileEditor } from "@/components/app/profile-editor";
import { ResumeUpload } from "@/components/app/resume-upload";
import { requireUserId } from "@/lib/auth";
import { emptyProfile } from "@/lib/profile/schema";
import { getProfileRecord } from "@/lib/profile/store";

import { saveProfileAction, uploadResume } from "./actions";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const userId = await requireUserId();
  const record = await getProfileRecord(userId);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Every draft uses only what’s here. Fix anything we got wrong and add what’s missing: the assistant will
          never fill gaps by guessing.
        </p>
      </header>
      <ResumeUpload action={uploadResume} currentFilename={record.resumeFilename} />
      {/* Re-mount the editor when a new parse lands so it picks up the fresh profile. */}
      <ProfileEditor
        key={record.parsedAt?.toISOString() ?? "manual"}
        initial={record.profile ?? emptyProfile()}
        onSave={saveProfileAction}
      />
    </div>
  );
}
