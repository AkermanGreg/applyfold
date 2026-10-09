import { describe, expect, it } from "vitest";

import { parseJobLink } from "./link";

describe("parseJobLink", () => {
  it("recognizes ATS links we can read through their public APIs", () => {
    expect(parseJobLink("https://boards.greenhouse.io/sweetgreen/jobs/8249618")).toEqual({
      kind: "greenhouse",
      token: "sweetgreen",
      id: "8249618",
    });
    expect(parseJobLink("https://job-boards.greenhouse.io/oscar/jobs/123?gh_src=x")).toMatchObject({ kind: "greenhouse", id: "123" });
    expect(parseJobLink("https://jobs.lever.co/spotify/2193db3f-77c5-43b8-b030-8f92c9882bf1/apply")).toEqual({
      kind: "lever",
      slug: "spotify",
      id: "2193db3f-77c5-43b8-b030-8f92c9882bf1",
    });
    expect(parseJobLink("https://jobs.ashbyhq.com/headway/1f473f3b-437d")).toMatchObject({ kind: "ashby", slug: "headway" });
  });

  it("refuses sites whose terms forbid automated access", () => {
    expect(parseJobLink("https://www.linkedin.com/jobs/view/123")).toEqual({ kind: "blocked", host: "linkedin.com" });
    expect(parseJobLink("https://uk.indeed.com/viewjob?jk=abc")).toEqual({ kind: "blocked", host: "indeed.com" });
  });

  it("falls back to fetching other employer pages", () => {
    expect(parseJobLink("https://careers.example-hospital.org/jobs/rn-icu")).toEqual({
      kind: "page",
      url: "https://careers.example-hospital.org/jobs/rn-icu",
    });
  });

  it("rejects junk and private-network URLs", () => {
    expect(parseJobLink("not a url").kind).toBe("invalid");
    expect(parseJobLink("ftp://example.com/job").kind).toBe("invalid");
    expect(parseJobLink("http://localhost:3000/admin").kind).toBe("invalid");
    expect(parseJobLink("http://169.254.169.254/latest/meta-data").kind).toBe("invalid");
    expect(parseJobLink("http://192.168.1.10/").kind).toBe("invalid");
  });
});
