import { z } from "zod";

import { politeFetchJson } from "@/lib/http";

import { detectRemote } from "../normalize";
import { decodeEntities, htmlToText } from "../text";
import type { NormalizedJob } from "../types";

/*
 * Hacker News "Ask HN: Who is hiring?" via the official Algolia HN API. Tech-heavy and free-form:
 * top-level comments conventionally start "Company | Role | Location | …". We only keep posts that
 * follow that shape, and link to the comment itself.
 */

const API = "https://hn.algolia.com/api/v1";

const storySearch = z.looseObject({
  hits: z.array(z.looseObject({ objectID: z.string(), title: z.string(), created_at: z.string() })),
});

const commentSearch = z.looseObject({
  hits: z.array(
    z.looseObject({
      objectID: z.string(),
      comment_text: z.string().nullish(),
      parent_id: z.number().nullish(),
      story_id: z.number().nullish(),
      created_at: z.string().nullish(),
    }),
  ),
});

/** Parse the conventional first line. Returns null for comments that don't follow it. */
export function parseHiringHeader(firstLine: string): { company: string; title: string; location: string | null } | null {
  const parts = firstLine
    .split("|")
    .map((part) => part.replace(/\(\s*https?:\/\/[^)]*\)/g, "").replace(/https?:\/\/\S+/g, "").trim())
    .filter(Boolean);
  if (parts.length < 3) return null;
  const [company, title, location] = parts as [string, string, string];
  if (company.length > 80 || title.length > 120) return null;
  return { company, title, location: location || null };
}

export function mapHnComments(storyId: string, json: unknown): NormalizedJob[] {
  return commentSearch.parse(json).hits.flatMap((comment) => {
    if (String(comment.parent_id) !== storyId || !comment.comment_text) return [];
    const html = comment.comment_text;
    const firstLine = decodeEntities(html.split(/<p>|\n/)[0]!.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    const header = parseHiringHeader(firstLine);
    if (!header) return [];
    const url = `https://news.ycombinator.com/item?id=${comment.objectID}`;
    return [
      {
        sourceKind: "hn" as const,
        externalId: comment.objectID,
        title: header.title,
        company: header.company,
        location: header.location,
        remote: detectRemote(firstLine),
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
        description: htmlToText(html),
        applyUrl: url,
        sourceUrl: url,
        atsType: null,
        postedAt: comment.created_at ? new Date(comment.created_at) : null,
        questions: null,
      },
    ];
  });
}

/** Latest monthly thread's top-level postings. */
export async function fetchHnWhoIsHiring(): Promise<NormalizedJob[]> {
  const stories = storySearch.parse(
    await politeFetchJson(`${API}/search_by_date?tags=story,author_whoishiring&query=${encodeURIComponent("who is hiring")}&hitsPerPage=3`),
  );
  const story = stories.hits.find((hit) => /who is hiring/i.test(hit.title));
  if (!story) return [];
  const json = await politeFetchJson(`${API}/search?tags=comment,story_${story.objectID}&hitsPerPage=1000`, { timeoutMs: 20_000 });
  return mapHnComments(story.objectID, json);
}
