import { describe, expect, it } from "vitest";

import { classifyQuestion } from "./classify";
import { resolveStandardAnswer, type SavedAnswers } from "./resolve";

const key = (label: string, fieldTypes?: string[]) => {
  const result = classifyQuestion(label, fieldTypes);
  return result.type === "standard" || result.type === "profile" || result.type === "file" ? result.key : result.type;
};

describe("classifyQuestion: rules from the brief", () => {
  it("'right to work without sponsorship' is work authorization, not sponsorship", () => {
    expect(key("Do you have the right to work in the UK without sponsorship?")).toBe("work_authorization");
    expect(key("Are you legally authorized to work in the United States without the need for visa sponsorship?")).toBe(
      "work_authorization",
    );
    expect(key("Are you eligible to work in Canada without requiring sponsorship?")).toBe("work_authorization");
  });

  it("plain sponsorship questions go to the sponsorship rule", () => {
    expect(key("Will you now or in the future require sponsorship for employment visa status (e.g. H-1B)?")).toBe(
      "needs_sponsorship",
    );
    expect(key("Do you require a visa to work here?")).toBe("needs_sponsorship");
  });

  it("asking both at once is left to the drafter, which sees both facts", () => {
    expect(key("Are you authorized to work in the US, and will you require sponsorship?")).toBe("open");
  });

  it("non-compete and non-competition are the same question", () => {
    expect(key("Are you subject to a non-compete agreement?")).toBe("non_compete");
    expect(key("Are you bound by any non-competition or non-solicitation agreements?")).toBe("non_compete");
    expect(key("Do you have a noncompete with your current employer?")).toBe("non_compete");
    expect(key("Are you party to any restrictive covenants?")).toBe("non_compete");
  });
});

describe("classifyQuestion: everyday questions", () => {
  it.each([
    ["Are you legally authorized to work in the United States?", "work_authorization"],
    ["Are you at least 18 years of age?", "age_18_plus"],
    ["Are you willing to undergo a background check?", "background_check"],
    ["Are you willing to relocate?", "willing_to_relocate"],
    ["When can you start?", "start_date"],
    ["What is your notice period?", "notice_period"],
    ["What are your salary expectations?", "salary_expectation"],
    ["How did you hear about this job?", "how_did_you_hear"],
    ["Gender", "eeo_gender"],
    ["Are you Hispanic/Latino?", "eeo_race"],
    ["Veteran Status", "eeo_veteran"],
    ["Disability Status", "eeo_disability"],
    ["First Name", "first_name"],
    ["Last Name", "last_name"],
    ["Email", "email"],
    ["Phone", "phone"],
    ["LinkedIn Profile", "linkedin"],
    ["Zip code", "postal_code"],
    ["Why do you want to work at Riverside Health?", "open"],
    ["Describe a time you handled a difficult patient.", "open"],
  ])("%s → %s", (label, expected) => {
    expect(key(label)).toBe(expected);
  });

  it("detects file uploads from field types", () => {
    expect(key("Resume/CV", ["input_file", "textarea"])).toBe("resume");
    expect(key("Cover Letter", ["input_file", "textarea"])).toBe("cover_letter");
  });
});

describe("resolveStandardAnswer", () => {
  const saved: SavedAnswers = {
    work_authorization: "yes",
    needs_sponsorship: "no",
    non_compete: "no",
    start_date: "Within two weeks",
    how_did_you_hear: "Job board",
  };

  it("maps yes/no onto the form's exact option text", () => {
    expect(resolveStandardAnswer("work_authorization", saved, ["Yes", "No"])).toEqual({
      status: "answered",
      value: "Yes",
      source: "standard",
    });
    expect(
      resolveStandardAnswer("needs_sponsorship", saved, ["Yes, I will require sponsorship", "No, I will not"]),
    ).toMatchObject({ value: "No, I will not" });
  });

  it("returns plain Yes/No for free-text fields", () => {
    expect(resolveStandardAnswer("non_compete", saved)).toMatchObject({ status: "answered", value: "No" });
  });

  it("never guesses an unknown answer", () => {
    expect(resolveStandardAnswer("willing_to_relocate", saved, ["Yes", "No"])).toMatchObject({
      status: "needs_input",
      key: "willing_to_relocate",
    });
  });

  it("defaults EEO questions to the form's decline option", () => {
    expect(
      resolveStandardAnswer("eeo_gender", {}, ["Male", "Female", "Non-binary", "I don't wish to answer"]),
    ).toEqual({ status: "answered", value: "I don't wish to answer", source: "default" });
    expect(resolveStandardAnswer("eeo_veteran", {})).toMatchObject({ value: "Decline to self-identify" });
  });

  it("asks rather than picks when an EEO form has no decline option", () => {
    expect(resolveStandardAnswer("eeo_race", {}, ["Asian", "Black", "White"])).toMatchObject({
      status: "needs_input",
    });
  });

  it("uses the user's own EEO answer when they chose to give one", () => {
    expect(resolveStandardAnswer("eeo_gender", { eeo_gender: "Female" }, ["Male", "Female", "Decline"])).toMatchObject({
      value: "Female",
      source: "standard",
    });
  });

  it("matches 'how did you hear' to the closest option, falling back to Other", () => {
    expect(resolveStandardAnswer("how_did_you_hear", saved, ["LinkedIn", "Job Board", "Referral"])).toMatchObject({
      value: "Job Board",
    });
    expect(resolveStandardAnswer("how_did_you_hear", saved, ["LinkedIn", "Referral", "Other"])).toMatchObject({
      value: "Other",
    });
  });

  it("passes free text through unchanged", () => {
    expect(resolveStandardAnswer("start_date", saved)).toMatchObject({ value: "Within two weeks" });
  });
});
