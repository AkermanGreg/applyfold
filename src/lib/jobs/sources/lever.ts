import { z } from "zod";

import { politeFetchJson } from "@/lib/http";

import { detectRemote } from "../normalize";
import { htmlToText } from "../text";
import type { NormalizedJob } from "../types";

const leverPosting = z.looseObject({
  id: z.string(),
  text: z.string(),
  hostedUrl: z.url(),
  applyUrl: z.url().nullish(),
  createdAt: z.number().nullish(),
  workplaceType: z.string().nullish(),
  categories: z.looseObject({ location: z.string().nullish(), commitment: z.string().nullish() }).nullish(),
  descriptionPlain: z.string().nullish(),
  lists: z.array(z.looseObject({ text: z.string(), content: z.string() })).nullish(),
  additionalPlain: z.string().nullish(),
  salaryRange: z
    .looseObject({ min: z.number().nullish(), max: z.number().nullish(), currency: z.string().nullish() })
    .nullish(),
});

const leverResponse = z.array(leverPosting);

function titleCase(slug: string) {
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function mapLeverPostings(slug: string, json: unknown, companyName?: string | null): NormalizedJob[] {
  return leverResponse.parse(json).map((posting) => {
    const location = posting.categories?.location?.trim() || null;
    const sections = (posting.lists ?? []).map((list) => `${list.text}\n${htmlToText(list.content)}`);
    const description = [posting.descriptionPlain, ...sections, posting.additionalPlain]
      .filter(Boolean)
      .join("\n\n")
      .trim();
    const workplace = posting.workplaceType === "unspecified" ? null : posting.workplaceType;
    return {
      sourceKind: "lever",
      externalId: `${slug}:${posting.id}`,
      title: posting.text.trim(),
      company: companyName || titleCase(slug),
      location,
      remote: detectRemote(workplace, location),
      salaryMin: posting.salaryRange?.min ?? null,
      salaryMax: posting.salaryRange?.max ?? null,
      salaryCurrency: posting.salaryRange?.currency ?? null,
      description,
      applyUrl: posting.applyUrl ?? posting.hostedUrl,
      sourceUrl: null,
      atsType: "lever",
      postedAt: posting.createdAt ? new Date(posting.createdAt) : null,
      questions: null,
    };
  });
}

export async function fetchLeverPostings(slug: string, companyName?: string | null): Promise<NormalizedJob[]> {
  const json = await politeFetchJson(`https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`);
  return mapLeverPostings(slug, json, companyName);
}
