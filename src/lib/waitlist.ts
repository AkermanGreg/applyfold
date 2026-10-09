import { z } from "zod";

export const WAITLIST_ROLES = [
  "Healthcare",
  "Education",
  "Sales & marketing",
  "Skilled trades",
  "Office & admin",
  "Tech",
  "Other",
] as const;

export const waitlistSchema = z.object({
  email: z
    .email({ error: "Enter a valid email address." })
    .max(254)
    .transform((value) => value.trim().toLowerCase()),
  role: z.enum(WAITLIST_ROLES).optional(),
  /** Honeypot: hidden from people, filled in by naive bots. */
  website: z.literal("").optional(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;

export type WaitlistState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; email?: string; role?: string };

export function parseWaitlistForm(formData: FormData) {
  const role = formData.get("role");
  return waitlistSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    role: typeof role === "string" && role !== "" ? role : undefined,
    website: String(formData.get("website") ?? ""),
  });
}
