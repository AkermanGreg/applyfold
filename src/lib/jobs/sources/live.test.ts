import { describe, expect, it } from "vitest";

import { fetchAshbyBoard } from "./ashby";
import { fetchGreenhouseBoard, fetchGreenhouseQuestions } from "./greenhouse";
import { fetchLeverPostings } from "./lever";

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
});
