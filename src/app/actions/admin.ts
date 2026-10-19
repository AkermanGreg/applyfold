"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { compPlan, grantCredits, requireAdmin, revokeComp } from "@/lib/admin";

export type AdminActionState = { status: "idle" } | { status: "done" | "error"; message: string };

const note = z
  .string()
  .trim()
  .max(200)
  .transform((value) => value || null);

const grantSchema = z.object({
  userId: z.string().min(1).max(100),
  amount: z.coerce.number().int().min(1, "Give at least 1 credit.").max(500, "That's more than 500 at once."),
  note,
});

export async function grantCreditsAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { user } = await requireAdmin();
  const parsed = grantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the form." };
  await grantCredits({ adminEmail: user.email, kind: "tailored_application", ...parsed.data });
  refresh();
  return { status: "done", message: `Added ${parsed.data.amount} drafts.` };
}

const compSchema = z.object({
  userId: z.string().min(1).max(100),
  plan: z.enum(["pro", "autopilot"]),
  days: z.coerce.number().int().min(1).max(365),
  note,
});

export async function compPlanAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { user } = await requireAdmin();
  const parsed = compSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the form." };
  await compPlan({ adminEmail: user.email, ...parsed.data });
  refresh();
  return { status: "done", message: `${parsed.data.plan === "pro" ? "Pro" : "Autopilot"} for ${parsed.data.days} days.` };
}

export async function revokeCompAction(userId: string) {
  const { user } = await requireAdmin();
  await revokeComp({ adminEmail: user.email, userId: z.string().min(1).max(100).parse(userId) });
  refresh();
}
