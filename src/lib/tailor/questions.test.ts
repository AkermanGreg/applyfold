import { describe, expect, it } from "vitest";

import type { JobQuestion } from "@/lib/jobs/types";
import { emptyProfile, type Profile } from "@/lib/profile/schema";

import { planAnswers } from "./questions";

const profile: Profile = {
  ...emptyProfile(),
  contact: { ...emptyProfile().contact, fullName: "Maya Patel", email: "maya@example.com", phone: null },
  experience: [
    { title: "Registered Nurse", employer: "St. Anne's", location: null, start: "2021", end: null, current: true, highlights: [] },
  ],
};

const q = (label: string, type = "input_text", options?: string[]): JobQuestion => ({
  label,
  required: true,
  fields: [{ name: label, type, ...(options ? { options } : {}) }],
});

describe("planAnswers", () => {
  const { answered, open } = planAnswers(
    [
      q("First Name"),
      q("Phone"),
      q("Resume/CV", "input_file"),
      q("Do you have the right to work in the US without sponsorship?", "multi_value_single_select", ["Yes", "No"]),
      q("Are you willing to relocate?", "multi_value_single_select", ["Yes", "No"]),
      q("Gender", "multi_value_single_select", ["Male", "Female", "Decline to self-identify"]),
      q("Current Company"),
      q("Why do you want to join our ICU team?", "textarea"),
    ],
    profile,
    { work_authorization: "yes" },
  );
  const byQuestion = Object.fromEntries(answered.map((answer) => [answer.question, answer]));

  it("fills contact details from the profile", () => {
    expect(byQuestion["First Name"]).toMatchObject({ answer: "Maya", source: "profile", needsInput: null });
    expect(byQuestion["Current Company"]).toMatchObject({ answer: "St. Anne's" });
  });

  it("flags missing profile facts instead of guessing", () => {
    expect(byQuestion["Phone"]).toMatchObject({ answer: "", needsInput: "Add your phone to your profile" });
  });

  it("uses saved answers and EEO defaults with the form's exact options", () => {
    expect(byQuestion["Do you have the right to work in the US without sponsorship?"]?.answer).toBe("Yes");
    expect(byQuestion["Gender"]?.answer).toBe("Decline to self-identify");
  });

  it("asks once for unknown screening answers", () => {
    expect(byQuestion["Are you willing to relocate?"]).toMatchObject({ answer: "", needsInput: "No saved answer yet" });
  });

  it("skips uploads and routes essays to the drafter", () => {
    expect(byQuestion["Resume/CV"]).toBeUndefined();
    expect(open).toEqual(["Why do you want to join our ICU team?"]);
  });
});
