import { describe, expect, it } from "vitest";

import { fetchAshbyBoard } from "./ashby";
import { fetchGreenhouseBoard, fetchGreenhouseQuestions } from "./greenhouse";
import { fetchHnWhoIsHiring } from "./hn";
import { fetchLeverPostings } from "./lever";
import { fetchRemoteOk } from "./remoteok";
import { fetchRipplingBoard } from "./rippling";
import { fetchRssFeed, RSS_FEEDS } from "./rss";
import { fetchSmartRecruitersPosting } from "./smartrecruiters";
import { fetchWorkableAccount } from "./workable";

// Hits real public job boards. Opt in with `LIVE_SOURCES=1 pnpm test` (never in CI).
describe.runIf(process.env.LIVE_SOURCES === "1")("live job boards", () => {
  it("Greenhouse board + questions", async () => {
    const jobs = await fetchGreenhouseBoard("sweetgreen", "sweetgreen");
    expect(jobs.length).toBeGreaterThan(0);
    const questions = await fetchGreenhouseQuestions(jobs[0]!.externalId);
    expect(questions.some((q) => q.fields.some((f) => f.name === "first_name"))).toBe(true);
  }, 30_000);

  it("Lever postings", async () => {
    const jobs = await fetchLeverPostings("spotify", "Spotify");
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs[0]!.description.length).toBeGreaterThan(50);
  }, 30_000);

  it("Ashby board", async () => {
    const jobs = await fetchAshbyBoard("headway", "Headway");
    expect(jobs.length).toBeGreaterThan(0);
  }, 30_000);

  it("Workable account", async () => {
    expect((await fetchWorkableAccount("humanmade")).length).toBeGreaterThan(0);
  }, 30_000);

  it("Rippling board", async () => {
    expect((await fetchRipplingBoard("xwp")).length).toBeGreaterThan(0);
  }, 60_000);

  it("SmartRecruiters posting", async () => {
    const list = (await (await fetch("https://api.smartrecruiters.com/v1/companies/Equinox/postings?limit=1")).json()) as {
      content: { id: string }[];
    };
    const job = await fetchSmartRecruitersPosting("Equinox", list.content[0]!.id);
    expect(job.description.length).toBeGreaterThan(50);
  }, 30_000);

  it("Remote OK, Hacker News and RSS feeds", async () => {
    expect((await fetchRemoteOk()).length).toBeGreaterThan(10);
    expect((await fetchHnWhoIsHiring()).length).toBeGreaterThan(10);
    for (const feed of RSS_FEEDS) expect((await fetchRssFeed(feed)).length).toBeGreaterThan(0);
  }, 90_000);
});
