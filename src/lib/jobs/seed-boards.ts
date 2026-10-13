import type { ATS_KINDS } from "./types";

type BoardKind = (typeof ATS_KINDS)[number];
type SeedBoard = { kind: BoardKind; slug: string; companyName?: string };

const many = (kind: BoardKind, slugs: string[]): SeedBoard[] => slugs.map((slug) => ({ kind, slug }));

/**
 * Starter set of public company boards, each verified live (Oct 2026). Non-tech employers
 * (clinicians, restaurants, hospitality, fitness) sit alongside the web/WordPress-heavy list from
 * the prototype. Company names come from the board itself where the API provides one; users can
 * add more by pasting any job link, and aggregators cover the long tail by keyword.
 */
export const SEED_BOARDS: SeedBoard[] = [
  // Non-tech and mixed employers.
  { kind: "greenhouse", slug: "sweetgreen", companyName: "sweetgreen" },
  { kind: "greenhouse", slug: "onemedical", companyName: "One Medical" },
  { kind: "greenhouse", slug: "oscar", companyName: "Oscar Health" },
  { kind: "greenhouse", slug: "zocdoc", companyName: "Zocdoc" },
  { kind: "ashby", slug: "headway", companyName: "Headway" },
  { kind: "ashby", slug: "sesame", companyName: "Sesame" },
  { kind: "ashby", slug: "found", companyName: "Found" },
  { kind: "lever", slug: "ro", companyName: "Ro" },
  { kind: "lever", slug: "brightwheel", companyName: "brightwheel" },
  { kind: "smartrecruiters", slug: "Sodexo", companyName: "Sodexo" },
  { kind: "smartrecruiters", slug: "Equinox", companyName: "Equinox" },

  ...many("greenhouse", [
    "akqa", "automatticcareers", "boingo", "brex", "bruntworkwear", "calendly", "catchcreationllc", "chime",
    "crunchyroll", "dept", "discord", "dollarshaveclub", "figma", "godaddy", "goldenstate", "goop", "gruns",
    "gumgum", "gusto", "hearst", "hugeinc", "infuse", "monks", "pantheon", "pinterest", "pmc",
    "powerdigitalmarketing", "pressable", "reddit", "specterops", "squarespace", "stripe",
    "themontageaccessoriescoltd", "turbotenantinternational", "typeform", "vercel", "voxmedia", "webflow", "zwift",
    "unitedfirm", "tealmedia", "nmi", "presencelearning", "alphasense", "firmpilotailawfirmmarketing",
    "fueledcareers", "canonical", "charterup", "redventures", "bankrate", "insider", "axios", "fandom",
  ]),
  ...many("lever", [
    "spotify", "wealthfront", "assist-world", "getwingapp", "kinsta", "weloglobal", "standtogether", "brafton",
    "hevodata", "siteground", "oowlish", "decima-digital", "slate",
  ]),
  ...many("ashby", [
    "ramp", "deel", "notion", "dave", "devsavant", "onhires", "plaid", "poshmark", "rehire", "sanity", "substack",
    "Blacksmith Agency", "revstone", "hostinger", "stayai", "close", "careerswift.ai", "scale army careers", "raptive",
    "nerdwallet",
  ]),
  ...many("workable", [
    "awesomemotive", "cleeng-1", "evolving-web", "fuku", "humanmade", "hunt-st", "huzzle", "intellibright",
    "intetics-2", "lago-1", "pavago", "secure-iq-services", "steadyvision", "uptalent-dot-i-o", "wati-dot-i-o",
    "wpbuffs", "usm-office", "oneteam-aviation-marketing", "wisevu", "screenpal", "c9staff", "innovationteam",
    "rocket-dot-n-et", "keller-executive-search", "pairedrecruiting", "hospitable", "kanopi", "futureplc",
  ]),
  ...many("rippling", ["xwp", "foreup", "xplor", "tpd-careers", "nexcess", "demandpdx", "executionspace", "interplaylearning"]),
];
