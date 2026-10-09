import type { SourceKind } from "./types";

/**
 * Starter set of public ATS boards, verified live in Oct 2026, chosen to include non-tech roles
 * (clinicians, restaurant managers, care teams) alongside office and tech jobs. Users can add
 * more companies; aggregators (USAJobs, Adzuna) cover the long tail by keyword.
 */
export const SEED_BOARDS: { kind: Extract<SourceKind, "greenhouse" | "lever" | "ashby">; slug: string; companyName: string }[] = [
  { kind: "greenhouse", slug: "sweetgreen", companyName: "sweetgreen" },
  { kind: "greenhouse", slug: "onemedical", companyName: "One Medical" },
  { kind: "greenhouse", slug: "oscar", companyName: "Oscar Health" },
  { kind: "greenhouse", slug: "zocdoc", companyName: "Zocdoc" },
  { kind: "greenhouse", slug: "chime", companyName: "Chime" },
  { kind: "greenhouse", slug: "gusto", companyName: "Gusto" },
  { kind: "ashby", slug: "headway", companyName: "Headway" },
  { kind: "ashby", slug: "sesame", companyName: "Sesame" },
  { kind: "ashby", slug: "found", companyName: "Found" },
  { kind: "ashby", slug: "ramp", companyName: "Ramp" },
  { kind: "ashby", slug: "deel", companyName: "Deel" },
  { kind: "ashby", slug: "notion", companyName: "Notion" },
  { kind: "lever", slug: "ro", companyName: "Ro" },
  { kind: "lever", slug: "brightwheel", companyName: "brightwheel" },
  { kind: "lever", slug: "spotify", companyName: "Spotify" },
  { kind: "lever", slug: "wealthfront", companyName: "Wealthfront" },
];
