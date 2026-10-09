"use server";

import { db, schema } from "@/db";
import { MissingEnvError } from "@/lib/env";
import { parseWaitlistForm, type WaitlistState } from "@/lib/waitlist";

const SUCCESS: WaitlistState = {
  status: "success",
  message: "You're on the list. We'll email you when your invite is ready.",
};

export async function joinWaitlist(
  _previous: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const parsed = parseWaitlistForm(formData);
  // React resets the form after each submit; echo values back so errors don't wipe the input.
  const submitted = { email: String(formData.get("email") ?? ""), role: String(formData.get("role") ?? "") };
  if (!parsed.success) {
    const honeypotTripped = parsed.error.issues.some((issue) => issue.path[0] === "website");
    // Bots get the same success message so they learn nothing.
    if (honeypotTripped) return SUCCESS;
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check your details.",
      ...submitted,
    };
  }

  try {
    await db()
      .insert(schema.waitlist)
      .values({ email: parsed.data.email, role: parsed.data.role, source: "landing" })
      .onConflictDoNothing({ target: schema.waitlist.email });
    return SUCCESS;
  } catch (error) {
    if (error instanceof MissingEnvError) {
      return { status: "error", message: "The waitlist isn't connected yet. Try again soon.", ...submitted };
    }
    console.error("waitlist insert failed", error);
    return { status: "error", message: "Something went wrong. Please try again.", ...submitted };
  }
}
