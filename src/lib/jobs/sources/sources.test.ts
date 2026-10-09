import { describe, expect, it } from "vitest";

import { mapAdzuna } from "./adzuna";
import { mapAshbyBoard } from "./ashby";
import { mapGreenhouseBoard, mapGreenhouseQuestions } from "./greenhouse";
import { mapLeverPostings } from "./lever";
import { mapUsaJobs } from "./usajobs";

// Synthetic fixtures that mirror each API's documented/observed shape (Oct 2026).

describe("Greenhouse", () => {
  const board = {
    jobs: [
      {
        id: 101,
        title: "Assistant Restaurant Manager",
        absolute_url: "https://boards.greenhouse.io/examplefoods/jobs/101",
        company_name: " Example Foods",
        location: { name: "Austin, TX" },
        first_published: "2026-10-02T12:52:25-04:00",
        updated_at: "2026-10-03T09:00:00-04:00",
        content: "&lt;p&gt;Lead a team of 20.&lt;/p&gt;",
        metadata: [],
      },
    ],
    meta: { total: 1 },
  };

  it("maps a board into normalized jobs", () => {
    const [job] = mapGreenhouseBoard("examplefoods", board);
    expect(job).toMatchObject({
      sourceKind: "greenhouse",
      externalId: "examplefoods:101",
      company: "Example Foods",
      location: "Austin, TX",
      remote: "unknown",
      description: "Lead a team of 20.",
      applyUrl: "https://boards.greenhouse.io/examplefoods/jobs/101",
      atsType: "greenhouse",
    });
    expect(job?.postedAt?.toISOString()).toBe("2026-10-02T16:52:25.000Z");
  });

  it("maps application questions with options", () => {
    const questions = mapGreenhouseQuestions({
      questions: [
        { label: "First Name", required: true, fields: [{ name: "first_name", type: "input_text", values: [] }] },
        {
          label: "Are you legally authorized to work in the United States?",
          required: true,
          fields: [
            {
              name: "question_1",
              type: "multi_value_single_select",
              values: [
                { label: "Yes", value: 1 },
                { label: "No", value: 0 },
              ],
            },
          ],
        },
      ],
      location_questions: [],
    });
    expect(questions).toHaveLength(2);
    expect(questions[1]).toEqual({
      label: "Are you legally authorized to work in the United States?",
      required: true,
      fields: [{ name: "question_1", type: "multi_value_single_select", options: ["Yes", "No"] }],
    });
  });
});

describe("Lever", () => {
  it("joins description sections and reads workplace type", () => {
    const [job] = mapLeverPostings(
      "example-health",
      [
        {
          id: "abc",
          text: "Registered Nurse - ICU",
          hostedUrl: "https://jobs.lever.co/example-health/abc",
          applyUrl: "https://jobs.lever.co/example-health/abc/apply",
          createdAt: 1782214185805,
          workplaceType: "onsite",
          categories: { location: "Columbus, OH", commitment: "Full-time" },
          descriptionPlain: "Join our ICU team.",
          lists: [{ text: "Requirements", content: "<li>BLS</li><li>ACLS</li>" }],
          additionalPlain: "We offer tuition support.",
        },
      ],
      null,
    );
    expect(job).toMatchObject({
      externalId: "example-health:abc",
      company: "Example Health",
      remote: "onsite",
      applyUrl: "https://jobs.lever.co/example-health/abc/apply",
    });
    expect(job?.description).toBe("Join our ICU team.\n\nRequirements\n• BLS\n• ACLS\n\nWe offer tuition support.");
  });
});

describe("Ashby", () => {
  it("reads salary components, remote flag, and skips unlisted jobs", () => {
    const jobs = mapAshbyBoard(
      "example-care",
      {
        apiVersion: "1",
        jobs: [
          {
            id: "j1",
            title: "Remote Licensed Clinical Social Worker",
            location: "Remote",
            isRemote: true,
            isListed: true,
            workplaceType: "Remote",
            publishedAt: "2026-10-05T15:33:48.103+00:00",
            jobUrl: "https://jobs.ashbyhq.com/example-care/j1",
            applyUrl: "https://jobs.ashbyhq.com/example-care/j1/application",
            descriptionPlain: "Provide therapy to clients via telehealth.",
            compensation: {
              summaryComponents: [
                { compensationType: "Salary", currencyCode: "USD", minValue: 70000, maxValue: 90000 },
                { compensationType: "EquityCashValue", currencyCode: "USD", minValue: null, maxValue: null },
              ],
            },
          },
          { id: "j2", title: "Hidden", isListed: false, jobUrl: "https://jobs.ashbyhq.com/example-care/j2" },
        ],
      },
      "Example Care",
    );
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      company: "Example Care",
      remote: "remote",
      salaryMin: 70000,
      salaryMax: 90000,
      salaryCurrency: "USD",
    });
  });
});

describe("USAJobs", () => {
  it("annualizes hourly pay and prefers the apply URI", () => {
    const [job] = mapUsaJobs({
      SearchResult: {
        SearchResultCount: 1,
        SearchResultItems: [
          {
            MatchedObjectId: 1,
            MatchedObjectDescriptor: {
              PositionID: "VA-26-0001",
              PositionTitle: "Practical Nurse",
              PositionURI: "https://www.usajobs.gov/job/1",
              ApplyURI: ["https://www.usajobs.gov/job/1/apply"],
              PositionLocationDisplay: "Dayton, Ohio",
              OrganizationName: "Veterans Health Administration",
              DepartmentName: "Department of Veterans Affairs",
              PositionRemuneration: [{ MinimumRange: "25.00", MaximumRange: "32.50", RateIntervalCode: "PH" }],
              PublicationStartDate: "2026-10-01T00:00:00.0000",
              QualificationSummary: "Active LPN license.",
              UserArea: { Details: { JobSummary: "Provide nursing care to Veterans.", MajorDuties: ["Administer medications"] } },
            },
          },
        ],
      },
    });
    expect(job).toMatchObject({
      externalId: "VA-26-0001",
      company: "Veterans Health Administration",
      salaryMin: 52000,
      salaryMax: 67600,
      applyUrl: "https://www.usajobs.gov/job/1/apply",
      sourceUrl: "https://www.usajobs.gov/job/1",
    });
    expect(job?.description).toContain("Administer medications");
  });
});

describe("Adzuna", () => {
  it("keeps the Adzuna redirect for attribution and drops predicted salaries", () => {
    const jobs = mapAdzuna(
      {
        __CLASS__: "Adzuna::API::Response::JobSearchResults",
        results: [
          {
            id: "4412",
            title: "Electrician",
            description: "Install and maintain wiring…",
            redirect_url: "https://www.adzuna.com/land/ad/4412",
            created: "2026-10-04T10:00:00Z",
            company: { display_name: "Bright Spark Ltd" },
            location: { display_name: "Leeds, West Yorkshire", area: ["UK", "Leeds"] },
            salary_min: 32000,
            salary_max: 38000,
            salary_is_predicted: "1",
          },
          {
            id: 4413,
            title: "Sales Associate",
            redirect_url: "https://www.adzuna.com/land/ad/4413",
            company: { display_name: "High Street Co" },
            salary_min: 24000,
            salary_max: 26000,
            salary_is_predicted: 0,
          },
        ],
      },
      "gb",
    );
    expect(jobs[0]).toMatchObject({ applyUrl: "https://www.adzuna.com/land/ad/4412", salaryMin: null });
    expect(jobs[1]).toMatchObject({ externalId: "gb:4413", salaryMin: 24000, salaryCurrency: "GBP" });
  });
});
