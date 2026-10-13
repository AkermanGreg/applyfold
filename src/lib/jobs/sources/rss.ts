import { CRAWLER_USER_AGENT, HttpError } from "@/lib/http";

import { detectRemote } from "../normalize";
import { decodeEntities, htmlToText } from "../text";
import type { NormalizedJob } from "../types";

/*
 * Job boards that publish RSS for syndication. Every listing links back to the board's own
 * posting page. Kept deliberately small: these are niche (WordPress) boards.
 */

export const RSS_FEEDS = [
  { id: "jobs.wordpress.net", url: "https://jobs.wordpress.net/feed/", remoteHint: false },
  { id: "wpremotework.com", url: "https://wpremotework.com/feed/", remoteHint: true },
] as const;

function tag(item: string, name: string): string | null {
  const match = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  if (!match) return null;
  return match[1]!.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1").trim();
}

export function mapRssFeed(feed: { id: string; remoteHint: boolean }, xml: string): NormalizedJob[] {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  return items.flatMap((item) => {
    const title = tag(item, "title");
    const link = tag(item, "link");
    if (!title || !link || !/^https?:\/\//.test(link)) return [];
    const body = tag(item, "content:encoded") ?? tag(item, "description") ?? "";
    const published = tag(item, "pubDate");
    const cleanTitle = decodeEntities(title);
    return [
      {
        sourceKind: "rss" as const,
        externalId: `${feed.id}:${tag(item, "guid") ?? link}`,
        title: cleanTitle,
        company: decodeEntities(tag(item, "dc:creator") ?? feed.id),
        location: feed.remoteHint ? "Remote" : null,
        remote: feed.remoteHint ? ("remote" as const) : detectRemote(cleanTitle),
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
        description: htmlToText(body),
        applyUrl: link,
        sourceUrl: link,
        atsType: null,
        postedAt: published ? new Date(published) : null,
        questions: null,
      },
    ];
  });
}

export async function fetchRssFeed(feed: (typeof RSS_FEEDS)[number]): Promise<NormalizedJob[]> {
  const response = await fetch(feed.url, {
    headers: { "User-Agent": CRAWLER_USER_AGENT, Accept: "application/rss+xml, application/xml" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new HttpError(response.status, feed.url);
  return mapRssFeed(feed, await response.text());
}
