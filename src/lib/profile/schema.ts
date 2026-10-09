import { z } from "zod";

/*
 * The structured profile every draft is built from. Shaped for Claude structured outputs:
 * every field present, `null` when the resume doesn't say, no inferred values.
 * Dates stay as written ("2021-06" or just "2019") rather than coerced, so we never invent a month.
 */

export const experienceSchema = z.object({
  title: z.string(),
  employer: z.string(),
  location: z.string().nullable(),
  start: z.string().nullable().describe('"YYYY-MM" or "YYYY" exactly as far as the resume says'),
  end: z.string().nullable().describe('"YYYY-MM", "YYYY", or null if current'),
  current: z.boolean(),
  highlights: z.array(z.string()).describe("Concrete achievements and duties, one per item, in the resume's words"),
});

export const educationSchema = z.object({
  institution: z.string(),
  credential: z.string().nullable().describe("Degree, diploma or certificate name"),
  field: z.string().nullable(),
  year: z.string().nullable().describe("Graduation or expected year"),
});

export const credentialSchema = z.object({
  name: z.string().describe("e.g. Registered Nurse (RN), BLS, CompTIA A+, Journeyman Electrician"),
  issuer: z.string().nullable(),
  expires: z.string().nullable(),
});

export const profileSchema = z.object({
  contact: z.object({
    fullName: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    location: z.string().nullable().describe("City, region/state, country as written"),
    postalCode: z.string().nullable(),
    linkedin: z.string().nullable(),
    website: z.string().nullable(),
  }),
  headline: z.string().nullable().describe("Short professional headline, e.g. 'ICU Registered Nurse'"),
  summary: z.string().nullable(),
  experience: z.array(experienceSchema),
  education: z.array(educationSchema),
  credentials: z.array(credentialSchema).describe("Licenses and certifications. Never include license numbers."),
  skills: z.array(z.string()),
  languages: z.array(z.string()),
});

export type Profile = z.infer<typeof profileSchema>;
export type Experience = z.infer<typeof experienceSchema>;

export const emptyProfile = (): Profile => ({
  contact: { fullName: null, email: null, phone: null, location: null, postalCode: null, linkedin: null, website: null },
  headline: null,
  summary: null,
  experience: [],
  education: [],
  credentials: [],
  skills: [],
  languages: [],
});

export function splitName(fullName: string | null): { first: string | null; last: string | null } {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: null, last: null };
  if (parts.length === 1) return { first: parts[0]!, last: null };
  return { first: parts[0]!, last: parts.slice(1).join(" ") };
}

/**
 * Render the profile as the fact sheet the drafting prompt cites. Deterministic output (stable
 * ordering, no timestamps) so the prompt-cache prefix stays byte-identical across requests.
 */
export function profileToFacts(profile: Profile): string {
  const lines: string[] = [];
  const { contact } = profile;
  if (contact.fullName) lines.push(`Name: ${contact.fullName}`);
  if (contact.location) lines.push(`Location: ${contact.location}`);
  if (profile.headline) lines.push(`Headline: ${profile.headline}`);
  if (profile.summary) lines.push(`Summary: ${profile.summary}`);
  if (profile.experience.length) {
    lines.push("", "Experience:");
    for (const job of profile.experience) {
      const dates = [job.start ?? "?", job.current ? "present" : (job.end ?? "?")].join(" – ");
      lines.push(`- ${job.title}, ${job.employer}${job.location ? ` (${job.location})` : ""}, ${dates}`);
      for (const highlight of job.highlights) lines.push(`  • ${highlight}`);
    }
  }
  if (profile.education.length) {
    lines.push("", "Education:");
    for (const item of profile.education) {
      const credential = [item.credential, item.field].filter(Boolean).join(", ");
      lines.push(`- ${credential || "Studies"}, ${item.institution}${item.year ? ` (${item.year})` : ""}`);
    }
  }
  if (profile.credentials.length) {
    lines.push("", "Licenses & certifications:");
    for (const item of profile.credentials) {
      lines.push(`- ${item.name}${item.issuer ? `, ${item.issuer}` : ""}${item.expires ? ` (expires ${item.expires})` : ""}`);
    }
  }
  if (profile.skills.length) lines.push("", `Skills: ${profile.skills.join(", ")}`);
  if (profile.languages.length) lines.push(`Languages: ${profile.languages.join(", ")}`);
  return lines.join("\n");
}
