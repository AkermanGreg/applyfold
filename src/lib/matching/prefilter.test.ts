import { describe, expect, it } from "vitest";

import { prefilter, type PrefilterPreferences, remoteRegionAllows, titleOverlap } from "./prefilter";

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

describe("remoteRegionAllows", () => {
  it("keeps open or home-region remote roles", () => {
    expect(remoteRegionAllows("Remote", "USD")).toBe(true);
    expect(remoteRegionAllows(null, "USD")).toBe(true);
    expect(remoteRegionAllows("Remote - Worldwide", "USD")).toBe(true);
    expect(remoteRegionAllows("Remote (United States)", "USD")).toBe(true);
    expect(remoteRegionAllows("Remote - US or Canada", "CAD")).toBe(true);
    expect(remoteRegionAllows("Remote, UK", "GBP")).toBe(true);
  });

  it("drops remote roles restricted to other countries", () => {
    expect(remoteRegionAllows("Remote - Pakistan", "USD")).toBe(false);
    expect(remoteRegionAllows("Remote (Australia)", "USD")).toBe(false);
    expect(remoteRegionAllows("Remote - LATAM", "GBP")).toBe(false);
  });

  it("applies inside the prefilter", () => {
    const job = { title: "Registered Nurse", location: "Remote - Philippines", remote: "remote" as const, salaryMax: null };
    expect(prefilter(job, { ...nurse, remote: "remote_only", salaryCurrency: "USD" }).keep).toBe(false);
    expect(prefilter({ ...job, location: "Remote (US)" }, { ...nurse, remote: "remote_only", salaryCurrency: "USD" }).keep).toBe(true);
  });
});
