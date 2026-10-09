"use server";

import { refresh } from "next/cache";

import { AiBudgetExceededError, AiOutputError } from "@/lib/ai/client";
import { requireUserId } from "@/lib/auth";
import { RESUME_MAX_BYTES, RESUME_TYPES, parseResume } from "@/lib/profile/parse-resume";
import { type Profile, profileSchema } from "@/lib/profile/schema";
import { saveProfile } from "@/lib/profile/store";
import { putUserFile } from "@/lib/storage";
import { consumeUsage, releaseUsage } from "@/lib/usage";
import { effectivePlan, ensureUser } from "@/lib/users";

export type UploadState = { status: "idle" } | { status: "error"; message: string } | { status: "done" };

export async function uploadResume(_previous: UploadState, formData: FormData): Promise<UploadState> {
  const userId = await requireUserId();
  const file = formData.get("resume");
  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "Choose a PDF or Word file." };
  const type = RESUME_TYPES[file.type as keyof typeof RESUME_TYPES];
  if (!type) return { status: "error", message: "Upload a PDF or .docx file." };
  if (file.size > RESUME_MAX_BYTES) return { status: "error", message: "That file is over 4 MB." };

  const user = await ensureUser(userId);
  const usage = await consumeUsage(userId, effectivePlan(user), "resume_parse");
  if (!usage.ok) return { status: "error", message: `You've parsed ${usage.limit} resumes this month. Edit your profile below instead.` };

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const [profile, blobPath] = await Promise.all([
      parseResume({ userId, type, bytes }),
      putUserFile(userId, `resume.${type}`, bytes, file.type),
    ]);
    await saveProfile(userId, profile, { blobPath, filename: file.name.slice(0, 200) });
    refresh();
    return { status: "done" };
  } catch (error) {
    await releaseUsage(userId, "resume_parse");
    if (error instanceof AiBudgetExceededError || error instanceof AiOutputError) {
      return { status: "error", message: error.message };
    }
    console.error("resume upload failed", error);
    return { status: "error", message: "We couldn't read that resume. Try another file or fill in your profile by hand." };
  }
}

export async function saveProfileAction(profile: Profile): Promise<{ ok: true } | { ok: false; message: string }> {
  const userId = await requireUserId();
  const parsed = profileSchema.safeParse(profile);
  if (!parsed.success) return { ok: false, message: "Some fields are invalid. Check and try again." };
  await ensureUser(userId);
  await saveProfile(userId, parsed.data);
  refresh();
  return { ok: true };
}
