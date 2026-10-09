import { z } from "zod";

export const REMOTE_OPTIONS = [
  { value: "any", label: "Open to anything" },
  { value: "remote_only", label: "Remote only" },
  { value: "hybrid_ok", label: "Remote or hybrid" },
  { value: "onsite_ok", label: "On-site is fine" },
] as const;

const listSplitOn = (separator: RegExp) =>
  z.string().transform((value) =>
    value
      .split(separator)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 10),
  );

/** Titles are comma-separated; locations contain commas ("Columbus, OH"), so they use ; or new lines. */
const titleList = listSplitOn(/[,;\n]/);
const locationList = listSplitOn(/[;\n]/);

export const preferencesFormSchema = z.object({
  targetTitles: titleList.refine((titles) => titles.length > 0, "Add at least one job title."),
  locations: locationList,
  remote: z.enum(["any", "remote_only", "hybrid_ok", "onsite_ok"]),
  salaryMin: z
    .string()
    .transform((value) => value.replace(/[^\d]/g, ""))
    .transform((value) => (value ? Number(value) : null))
    .pipe(z.number().int().positive().max(10_000_000).nullable()),
  salaryCurrency: z.enum(["USD", "GBP", "CAD", "AUD", "EUR"]),
});

export type PreferencesInput = z.infer<typeof preferencesFormSchema>;

export type Preferences = PreferencesInput & { digest: "off" | "weekly" | "daily" };
