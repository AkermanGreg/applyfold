import { describe, expect, it } from "vitest";

import { mapHnComments, parseHiringHeader } from "./hn";
import { mapJSearch } from "./jsearch";
import { mapRemoteOk } from "./remoteok";
import { mapRipplingJob } from "./rippling";
import { mapRssFeed } from "./rss";
import { mapSmartRecruitersPosting } from "./smartrecruiters";
import { mapTheMuse } from "./themuse";
import { mapWorkableAccount, WORKABLE_MAX_JOBS } from "./workable";

// Synthetic fixtures in each source's observed shape (Oct 2026).

describe("Workable", () => {
  const account = {
    name: "Example Studio, makers of things",
    description: "<p>About us</p>",
    jobs: [
      {
        title: "Customer Success Manager",
        shortcode: "AB12CD34",
        url: "https://apply.workable.com/j/AB12CD34",
        application_url: "https://apply.workable.com/j/AB12CD34/apply",
        telecommuting: "True",
        published_on: "2026-10-01",
        country: "United States",
        city: "",
        locations: [{ country: "United States", countryCode: "US", city: "Austin", region: "Texas" }],
        description: "<p>Help customers succeed.</p>",
      },
      { title: "Older role", shortcode: "OLD1", url: "https://apply.workable.com/j/OLD1", published_on: "2025-01-01" },
    ],
  };

  it("maps jobs, newest first, with account name as company", () => {
    const [first] = mapWorkableAccount("example-studio", account);
    expect(first).toMatchObject({
      sourceKind: "workable",
      externalId: "example-studio:AB12CD34",
      company: "Example Studio",
      location: "Austin, Texas, United States",
      remote: "remote",
      applyUrl: "https://apply.workable.com/j/AB12CD34/apply",
      description: "Help customers succeed.",
    });
  });

  it("caps huge staffing boards", () => {
    const jobs = Array.from({ length: WORKABLE_MAX_JOBS + 50 }, (_, i) => ({
      title: `Role ${i}`,
      shortcode: `C${i}`,
      url: `https://apply.workable.com/j/C${i}`,
      published_on: `2026-09-${String((i % 28) + 1).padStart(2, "0")}`,
    }));
    expect(mapWorkableAccount("big", { name: "Big", jobs })).toHaveLength(WORKABLE_MAX_JOBS);
  });
});

describe("Rippling", () => {
  it("maps a job detail with role text first", () => {
    const job = mapRipplingJob("example", {
      uuid: "u-1",
      name: "Support Specialist",
      url: "https://ats.rippling.com/example/jobs/u-1",
      companyName: "Example US LLC",
      createdOn: "2026-09-10T09:15:53.224000-07:00",
      workLocations: ["Remote (United States)"],
      description: { company: "<p>We build tools.</p>", role: "<p>Answer customer tickets.</p>" },
    });
    expect(job).toMatchObject({
      externalId: "example:u-1",
      company: "Example",
      remote: "remote",
      description: "Answer customer tickets.\n\nWe build tools.",
    });
  });
});

describe("SmartRecruiters", () => {
  it("joins job ad sections and reads remote flags", () => {
    const job = mapSmartRecruitersPosting("ExampleCo", {
      id: "7440001",
      name: "Hotel Front Desk Agent",
      company: { identifier: "ExampleCo", name: "Example Co" },
      location: { city: "Denver", country: "us", remote: false, hybrid: false },
      releasedDate: "2026-10-01T00:00:00.000Z",
      postingUrl: "https://jobs.smartrecruiters.com/ExampleCo/7440001-hotel-front-desk-agent",
      jobAd: {
        sections: {
          jobDescription: { text: "<p>Welcome guests.</p>" },
          qualifications: { text: "<p>1 year hospitality.</p>" },
          additionalInformation: { text: "" },
        },
      },
    });
    expect(job).toMatchObject({
      externalId: "ExampleCo:7440001",
      company: "Example Co",
      location: "Denver, US",
      remote: "unknown",
      description: "Welcome guests.\n\n1 year hospitality.",
      applyUrl: "https://jobs.smartrecruiters.com/ExampleCo/7440001-hotel-front-desk-agent",
    });
  });
});

describe("Remote OK", () => {
  it("skips the legal notice row and keeps the Remote OK link for attribution", () => {
    const jobs = mapRemoteOk([
      { last_updated: 1, legal: "API Terms of Service: Please link back…" },
      {
        id: "1137498",
        position: "Senior Sales Executive",
        company: "Example Corp",
        location: "",
        date: "2026-10-12T00:00:04+00:00",
        url: "https://remoteOK.com/remote-jobs/1137498",
        salary_min: "145000",
        salary_max: 220000,
        description: "<p>Sell things.</p>",
      },
      { not: "a job" },
    ]);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      sourceKind: "remoteok",
      location: "Remote",
      remote: "remote",
      salaryMin: 145000,
      salaryMax: 220000,
      sourceUrl: "https://remoteOK.com/remote-jobs/1137498",
    });
  });
});

describe("The Muse", () => {
  it("links through The Muse landing page", () => {
    const [job] = mapTheMuse({
      results: [
        {
          id: 22034987,
          name: "Medical Operations Coordinator",
          contents: "<p>Coordinate clinic operations.</p>",
          publication_date: "2026-08-07T00:00:43Z",
          locations: [{ name: "Columbus, OH" }],
          company: { name: "Example Health" },
          refs: { landing_page: "https://www.themuse.com/jobs/examplehealth/medical-operations-coordinator" },
        },
      ],
    });
    expect(job).toMatchObject({ company: "Example Health", location: "Columbus, OH", sourceUrl: job!.applyUrl });
  });
});

describe("JSearch", () => {
  it("annualizes hourly pay", () => {
    const [job] = mapJSearch({
      data: [
        {
          job_id: "abc",
          job_title: "Licensed Practical Nurse",
          employer_name: "Example Care",
          job_apply_link: "https://careers.example.com/lpn",
          job_city: "Dayton",
          job_state: "OH",
          job_country: "US",
          job_is_remote: false,
          job_min_salary: 25,
          job_max_salary: 30,
          job_salary_period: "HOUR",
        },
      ],
    });
    expect(job).toMatchObject({ location: "Dayton, OH, US", salaryMin: 52000, salaryMax: 62400, salaryCurrency: "USD" });
  });
});

describe("Hacker News Who is hiring", () => {
  it("parses the conventional first line", () => {
    expect(parseHiringHeader("Sendery ( https://sendery.co ) | iOS Engineer | Tokyo, Japan | Contract")).toEqual({
      company: "Sendery",
      title: "iOS Engineer",
      location: "Tokyo, Japan",
    });
    expect(parseHiringHeader("We're hiring lots of people, email me")).toBeNull();
  });

  it("keeps only top-level postings that follow the format", () => {
    const jobs = mapHnComments("100", {
      hits: [
        { objectID: "1", parent_id: 100, comment_text: "Acme | Support Engineer | Remote (US) | Full-time<p>We make widgets.", created_at: "2026-10-01T16:00:00Z" },
        { objectID: "2", parent_id: 1, comment_text: "Is this still open?" },
        { objectID: "3", parent_id: 100, comment_text: "Just a comment without the format" },
      ],
    });
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ company: "Acme", title: "Support Engineer", remote: "remote", applyUrl: "https://news.ycombinator.com/item?id=1" });
  });
});

describe("RSS feeds", () => {
  it("reads items with CDATA and entities", () => {
    const xml = `<rss><channel><item><title>WordPress Developer &#8211; Plugins</title><link>https://jobs.example.net/job/1/</link><guid>https://jobs.example.net/?p=1</guid><pubDate>Mon, 05 Oct 2026 10:00:00 +0000</pubDate><dc:creator><![CDATA[Example Agency]]></dc:creator><content:encoded><![CDATA[<p>Build plugins.</p>]]></content:encoded></item></channel></rss>`;
    const [job] = mapRssFeed({ id: "jobs.example.net", remoteHint: true }, xml);
    expect(job).toMatchObject({
      title: "WordPress Developer – Plugins",
      company: "Example Agency",
      remote: "remote",
      description: "Build plugins.",
      applyUrl: "https://jobs.example.net/job/1/",
    });
  });
});
