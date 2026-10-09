import "server-only";

import { eq } from "drizzle-orm";

import { db, schema } from "@/db";

import type { Preferences, PreferencesInput } from "./preferences";

export async function getPreferences(userId: string): Promise<Preferences | null> {
  const row = await db().query.preferences.findFirst({ where: eq(schema.preferences.userId, userId) });
  if (!row) return null;
  return {
    targetTitles: row.targetTitles,
    locations: row.locations,
    remote: row.remote,
    salaryMin: row.salaryMin,
    salaryCurrency: row.salaryCurrency as Preferences["salaryCurrency"],
    digest: row.digest,
  };
}

export async function savePreferences(userId: string, input: PreferencesInput) {
  await db()
    .insert(schema.preferences)
    .values({ userId, ...input })
    .onConflictDoUpdate({ target: schema.preferences.userId, set: input });
}
