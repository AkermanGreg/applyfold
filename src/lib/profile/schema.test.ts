import { describe, expect, it } from "vitest";

import { emptyProfile, type Profile, profileSchema, profileToFacts, splitName } from "./schema";

const maya: Profile = {
  ...emptyProfile(),
  contact: { ...emptyProfile().contact, fullName: "Maya Patel", location: "Columbus, OH" },
  headline: "ICU Registered Nurse",
  experience: [
    {
      title: "Registered Nurse, ICU",
      employer: "St. Anne's Medical Center",
      location: "Columbus, OH",
      start: "2021-06",
      end: null,
      current: true,
      highlights: ["Cared for 2–3 critical patients per shift", "Precepted 6 new graduate nurses"],
    },
  ],
  education: [{ institution: "Ohio State University", credential: "BSN", field: "Nursing", year: "2021" }],
  credentials: [{ name: "BLS", issuer: "American Heart Association", expires: "2027-03" }],
  skills: ["Ventilator management", "Epic"],
};

describe("profile schema", () => {
  it("accepts a fully specified profile", () => {
    expect(profileSchema.parse(maya)).toEqual(maya);
  });

  it("renders a stable fact sheet for the drafting prompt", () => {
    const facts = profileToFacts(maya);
    expect(facts).toContain("- Registered Nurse, ICU, St. Anne's Medical Center (Columbus, OH), 2021-06 – present");
    expect(facts).toContain("  • Precepted 6 new graduate nurses");
    expect(facts).toContain("- BSN, Nursing, Ohio State University (2021)");
    expect(facts).toContain("- BLS, American Heart Association (expires 2027-03)");
    expect(profileToFacts(maya)).toBe(facts);
  });

  it("splits names conservatively", () => {
    expect(splitName("Maya Patel")).toEqual({ first: "Maya", last: "Patel" });
    expect(splitName("Ana María de la Cruz")).toEqual({ first: "Ana", last: "María de la Cruz" });
    expect(splitName("Cher")).toEqual({ first: "Cher", last: null });
    expect(splitName(null)).toEqual({ first: null, last: null });
  });
});
