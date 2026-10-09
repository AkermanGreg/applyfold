import { describe, expect, it } from "vitest";

import { prefilter, type PrefilterPreferences, titleOverlap } from "./prefilter";

const nurse: PrefilterPreferences = {
  targetTitles: ["Registered Nurse", "ICU Nurse"],
  locations: ["Columbus, OH"],
  remote: "onsite_ok",
  salaryMin: 70_000,
};

describe("titleOverlap", () => {
  it("scores the best matching target title", () => {
    expect(titleOverlap("RN - Intensive Care (Nights)", ["Registered Nurse"])).toBe(1);
    expect(titleOverlap("Assistant Restaurant Manager", ["Restaurant Manager"])).toBe(1);
    expect(titleOverlap("Nurse Practitioner", ["Registered Nurse"])).toBe(0.5);
    expect(titleOverlap("Software Engineer", ["Registered Nurse", "ICU Nurse"])).toBe(0);
  });
});

describe("prefilter", () => {
  const job = { title: "Registered Nurse, ICU", location: "Columbus, Ohio", remote: "onsite" as const, salaryMax: null };

  it("keeps a good fit", () => {
    expect(prefilter(job, nurse)).toEqual({ keep: true, rank: 1 });
  });

  it("drops unrelated titles", () => {
    expect(prefilter({ ...job, title: "Line Cook" }, nurse).keep).toBe(false);
  });

  it("drops jobs in other cities but keeps remote ones", () => {
    expect(prefilter({ ...job, location: "Denver, CO" }, nurse).keep).toBe(false);
    expect(prefilter({ ...job, location: "Anywhere", remote: "remote" }, nurse).keep).toBe(true);
  });

  it("honours remote-only and hybrid preferences", () => {
    expect(prefilter(job, { ...nurse, remote: "remote_only" }).keep).toBe(false);
    expect(prefilter(job, { ...nurse, remote: "hybrid_ok" }).keep).toBe(false);
    expect(prefilter({ ...job, remote: "hybrid" }, { ...nurse, remote: "hybrid_ok" }).keep).toBe(true);
  });

  it("drops jobs whose posted maximum is below the salary floor, keeps unknown salaries", () => {
    expect(prefilter({ ...job, salaryMax: 60_000 }, nurse).keep).toBe(false);
    expect(prefilter({ ...job, salaryMax: 90_000 }, nurse).keep).toBe(true);
  });

  it("keeps every location when the user didn't set one", () => {
    expect(prefilter({ ...job, location: "Denver, CO" }, { ...nurse, locations: [] }).keep).toBe(true);
  });
});
