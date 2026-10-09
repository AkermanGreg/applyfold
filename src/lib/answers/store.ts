import "server-only";

import { eq, sql } from "drizzle-orm";

import { db, schema } from "@/db";
import { decrypt, encrypt } from "@/lib/crypto";

import type { SavedAnswers } from "./resolve";
import { isStandardAnswerKey, type StandardAnswerKey } from "./standard";

export async function getSavedAnswers(userId: string): Promise<SavedAnswers> {
  const rows = await db().query.standardAnswers.findMany({ where: eq(schema.standardAnswers.userId, userId) });
  const answers: SavedAnswers = {};
  for (const row of rows) if (isStandardAnswerKey(row.key)) answers[row.key] = decrypt(row.valueEnc);
  return answers;
}

/** Upsert the given answers; an empty string deletes the saved value (so it's asked again). */
export async function saveAnswers(userId: string, answers: Partial<Record<StandardAnswerKey, string>>) {
  const entries = Object.entries(answers) as [StandardAnswerKey, string][];
  const toSave = entries.filter(([, value]) => value.trim() !== "");
  const toClear = entries.filter(([, value]) => value.trim() === "").map(([key]) => key);

  if (toSave.length) {
    await db()
      .insert(schema.standardAnswers)
      .values(toSave.map(([key, value]) => ({ userId, key, valueEnc: encrypt(value.trim()) })))
      .onConflictDoUpdate({
        target: [schema.standardAnswers.userId, schema.standardAnswers.key],
        set: { valueEnc: sql`excluded.value_enc` },
      });
  }
  for (const key of toClear) {
    await db()
      .delete(schema.standardAnswers)
      .where(sql`${schema.standardAnswers.userId} = ${userId} and ${schema.standardAnswers.key} = ${key}`);
  }
}
