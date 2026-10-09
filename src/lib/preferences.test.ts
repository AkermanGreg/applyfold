import { describe, expect, it } from "vitest";

import { preferencesFormSchema } from "./preferences";

describe("preferencesFormSchema", () => {
  it("splits titles on commas but keeps commas inside locations", () => {
    const parsed = preferencesFormSchema.parse({
      targetTitles: "Registered Nurse, ICU Nurse\nCharge Nurse",
      locations: "Columbus, OH; Dayton, OH\nRemote",
      remote: "onsite_ok",
      salaryMin: "$72,000",
      salaryCurrency: "USD",
    });
    expect(parsed.targetTitles).toEqual(["Registered Nurse", "ICU Nurse", "Charge Nurse"]);
    expect(parsed.locations).toEqual(["Columbus, OH", "Dayton, OH", "Remote"]);
    expect(parsed.salaryMin).toBe(72000);
  });

  it("requires a title and allows an empty salary", () => {
    expect(
      preferencesFormSchema.safeParse({ targetTitles: " ", locations: "", remote: "any", salaryMin: "", salaryCurrency: "USD" })
        .success,
    ).toBe(false);
    expect(
      preferencesFormSchema.parse({ targetTitles: "Teacher", locations: "", remote: "any", salaryMin: "", salaryCurrency: "GBP" })
        .salaryMin,
    ).toBeNull();
  });
});
