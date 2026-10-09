import "server-only";

import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { decryptJson, encryptJson } from "@/lib/crypto";

import { type Profile, profileSchema } from "./schema";

export type ProfileRecord = {
  profile: Profile | null;
  resumeFilename: string | null;
  resumeBlobPath: string | null;
  parsedAt: Date | null;
};

export async function getProfileRecord(userId: string): Promise<ProfileRecord> {
  const row = await db().query.profiles.findFirst({ where: eq(schema.profiles.userId, userId) });
  return {
    profile: row?.dataEnc ? profileSchema.parse(decryptJson(row.dataEnc)) : null,
    resumeFilename: row?.resumeFilename ?? null,
    resumeBlobPath: row?.resumeBlobPath ?? null,
    parsedAt: row?.parsedAt ?? null,
  };
}

export async function saveProfile(
  userId: string,
  profile: Profile,
  resume?: { blobPath: string; filename: string },
) {
  const values = {
    dataEnc: encryptJson(profileSchema.parse(profile)),
    ...(resume ? { resumeBlobPath: resume.blobPath, resumeFilename: resume.filename, parsedAt: new Date() } : {}),
  };
  await db()
    .insert(schema.profiles)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: schema.profiles.userId, set: values });
}
