import type { ApplicationView } from "@/lib/applications";
import type { FeedItem } from "@/lib/feed";
import type { Profile } from "@/lib/profile/schema";

/*
 * Demo mode data. Maya Patel and every employer below are fictional. Drafts are hand-written
 * examples of the output style; demo mode never calls an API.
 */

export const DEMO_PROFILE: Profile = {
  contact: {
    fullName: "Maya Patel",
    email: "maya.patel@example.com",
    phone: "(614) 555-0142",
    location: "Columbus, OH",
    postalCode: "43215",
    linkedin: null,
    website: null,
  },
  headline: "ICU Registered Nurse",
  summary:
    "Registered nurse with four years in a 24-bed medical-surgical ICU. Calm under pressure, a steady preceptor for new graduates, and fluent in Epic.",
  experience: [
    {
      title: "Registered Nurse, Medical-Surgical ICU",
      employer: "St. Anne's Medical Center",
      location: "Columbus, OH",
      start: "2022-03",
      end: null,
      current: true,
      highlights: [
        "Care for 2–3 critically ill patients per shift, including ventilated and post-operative patients",
        "Precepted 6 new graduate nurses through 12-week orientation",
        "Member of the unit's rapid response team; led 30+ responses",
        "Helped roll out a new sepsis screening workflow that cut time-to-antibiotics on the unit",
      ],
    },
    {
      title: "Registered Nurse, Telemetry",
      employer: "Grandview Community Hospital",
      location: "Columbus, OH",
      start: "2020-07",
      end: "2022-02",
      current: false,
      highlights: [
        "Cared for 4–5 cardiac telemetry patients per shift",
        "Interpreted cardiac rhythms and escalated changes to the care team",
      ],
    },
  ],
  education: [{ institution: "Ohio State University", credential: "Bachelor of Science in Nursing", field: null, year: "2020" }],
  credentials: [
    { name: "Registered Nurse (RN), Ohio", issuer: "Ohio Board of Nursing", expires: "2027-08" },
    { name: "BLS", issuer: "American Heart Association", expires: "2027-03" },
    { name: "ACLS", issuer: "American Heart Association", expires: "2027-03" },
    { name: "CCRN", issuer: "AACN", expires: "2028-01" },
  ],
  skills: ["Ventilator management", "Hemodynamic monitoring", "Sepsis protocols", "Epic", "Patient and family education"],
  languages: ["English", "Gujarati"],
};

type DemoJob = FeedItem & { description: string };

const job = (fields: Omit<DemoJob, "status" | "attribution" | "postedAt"> & Partial<Pick<DemoJob, "status">>): DemoJob => ({
  status: "new",
  attribution: null,
  postedAt: null,
  ...fields,
});

export const DEMO_JOBS: DemoJob[] = [
  job({
    jobId: "riverside-icu-rn",
    title: "Registered Nurse, ICU (Nights)",
    company: "Riverside Health",
    location: "Columbus, OH",
    remote: "onsite",
    salaryMin: 78000,
    salaryMax: 96000,
    salaryCurrency: "USD",
    score: 94,
    reason: "Four years of ICU experience, CCRN, and current BLS/ACLS meet every core requirement.",
    description: `Riverside Health is hiring an experienced ICU nurse for our 32-bed adult intensive care unit (night shift, 3x12).

What you'll do
• Provide care for 1–2 critically ill adult patients per shift
• Manage ventilated patients, titrate vasoactive drips, and monitor hemodynamics
• Respond to rapid response and code events
• Precept new nurses and support a culture of safety

What you bring
• Active Ohio RN license (or compact)
• 2+ years of ICU experience
• BLS and ACLS required; CCRN preferred
• Epic experience a plus

Night differential, tuition support and a $10,000 sign-on bonus.`,
  }),
  job({
    jobId: "lakeview-cardiac-stepdown",
    title: "Clinical Nurse, Cardiac Step-Down",
    company: "Lakeview Medical Group",
    location: "Dublin, OH",
    remote: "onsite",
    salaryMin: 72000,
    salaryMax: 88000,
    salaryCurrency: "USD",
    score: 86,
    reason: "Telemetry rhythm interpretation plus ICU acuity; step-down asks for 1+ year cardiac.",
    description: `Join our cardiac step-down unit caring for post-procedure and heart failure patients.

Responsibilities
• Care for 3–4 patients with continuous cardiac monitoring
• Recognize and escalate rhythm changes and early deterioration
• Educate patients and families for a safe discharge home

Requirements
• Active RN license
• 1+ year of cardiac, telemetry, or critical care experience
• BLS and ACLS`,
  }),
  job({
    jobId: "summit-rapid-response",
    title: "Rapid Response Nurse",
    company: "Summit Regional Hospital",
    location: "Columbus, OH",
    remote: "onsite",
    salaryMin: 85000,
    salaryMax: 102000,
    salaryCurrency: "USD",
    score: 82,
    reason: "30+ rapid response calls led and ICU background fit well; posting wants 3+ years critical care.",
    description: `Our Rapid Response Team supports nurses hospital-wide when a patient's condition changes.

You will
• Respond to rapid response calls across all inpatient units
• Assess, stabilize, and coordinate escalation of deteriorating patients
• Round proactively on high-risk patients and coach bedside staff

You have
• 3+ years of critical care nursing
• BLS, ACLS; CCRN strongly preferred
• Excellent communication under pressure`,
  }),
  job({
    jobId: "carefirst-nurse-educator",
    title: "Clinical Nurse Educator",
    company: "CareFirst Home Health",
    location: "Columbus, OH",
    remote: "hybrid",
    salaryMin: 80000,
    salaryMax: 92000,
    salaryCurrency: "USD",
    score: 71,
    reason: "Precepting six new grads shows teaching strength; role prefers an MSN, which isn't on the profile.",
    description: `Design and deliver orientation and continuing education for our home health nursing team.

• Build and run onboarding for newly hired nurses
• Track competencies and coach clinicians in the field
• Partner with quality leaders on education for new protocols

Requirements: BSN, 3+ years of acute care experience, precepting experience. MSN preferred.`,
  }),
  job({
    jobId: "metro-urgent-care",
    title: "Urgent Care RN",
    company: "Metro Urgent Care",
    location: "Westerville, OH",
    remote: "onsite",
    salaryMin: 68000,
    salaryMax: 79000,
    salaryCurrency: "USD",
    score: 63,
    reason: "Strong acute assessment skills; day-shift urgent care is a lower-acuity change of pace.",
    description: `Fast-paced urgent care clinic, day shifts, no nights or holidays.

• Triage walk-in patients and assist providers with procedures
• Administer medications and vaccines
• Provide discharge education

Requirements: active RN license, 1+ year acute care experience, BLS.`,
  }),
  job({
    jobId: "brightpath-school-nurse",
    title: "School Nurse",
    company: "Brightpath Academy",
    location: "Columbus, OH",
    remote: "onsite",
    salaryMin: 52000,
    salaryMax: 60000,
    salaryCurrency: "USD",
    score: 41,
    reason: "Licensed RN, but the role centers on pediatrics and school health plans, which the profile doesn't show.",
    status: "skipped",
    description: `Support the health of 600 K–8 students: medication administration, care plans for chronic conditions, screenings, and health education. Requires RN license; pediatric experience preferred.`,
  }),
];

const demoAnswer = (
  id: string,
  question: string,
  answer: string,
  source: ApplicationView["answers"][number]["source"],
  needsInput: string | null = null,
) => ({ id, question, answer, source, needsInput });

export const DEMO_DRAFTS: Record<string, Omit<ApplicationView, "id" | "status" | "appliedAt" | "followUpAt">> = {
  "riverside-icu-rn": {
    coverLetter: {
      greeting: "Dear Riverside Health ICU Hiring Team,",
      paragraphs: [
        "For the past four years I've worked nights in St. Anne's 24-bed medical-surgical ICU, caring for ventilated and post-operative patients and titrating drips through the long hours when steady judgment matters most. Your opening for an experienced night-shift ICU nurse is exactly the work I want to keep doing.",
        "Beyond my own assignment, I'm one of the nurses the unit calls when things change fast: I've led more than 30 rapid response calls and helped roll out a sepsis screening workflow that shortened time-to-antibiotics on our unit. I hold my CCRN alongside current BLS and ACLS, and I chart in Epic every shift.",
        "I've also precepted six new graduate nurses through orientation. Your posting mentions supporting new nurses and a culture of safety; that's the part of my job I'm proudest of, and I'd love to bring it to Riverside.",
        "Thank you for your time. I'd welcome the chance to talk about how I can support your team on nights.",
      ],
      closing: "Sincerely,",
    },
    answers: [
      demoAnswer("a1", "First Name", "Maya", "profile"),
      demoAnswer("a2", "Last Name", "Patel", "profile"),
      demoAnswer("a3", "Email", "maya.patel@example.com", "profile"),
      demoAnswer("a4", "Do you hold an active Ohio or compact RN license?", "Yes", "standard"),
      demoAnswer("a5", "Are you legally authorized to work in the United States without sponsorship?", "Yes", "standard"),
      demoAnswer("a6", "Are you willing to work night shifts?", "Yes", "standard"),
      demoAnswer(
        "a7",
        "Describe a time you recognized a patient's deterioration early.",
        "During a night shift a post-operative patient's blood pressure trended down over two hours while still inside normal limits, and her heart rate crept up. I flagged it as possible early bleeding, called the rapid response team, and started fluids per protocol. Imaging confirmed a bleed and she went back to the OR within the hour. The surgeon later told our manager the early call made the difference.",
        "ai",
      ),
      demoAnswer("a8", "How did you hear about this position?", "Job board", "standard"),
      demoAnswer("a9", "Gender", "Decline to self-identify", "standard"),
    ],
  },
  "lakeview-cardiac-stepdown": {
    coverLetter: {
      greeting: "Dear Lakeview Medical Group Hiring Team,",
      paragraphs: [
        "I started my nursing career on a cardiac telemetry unit at Grandview Community Hospital, interpreting rhythms and escalating changes for four to five patients a shift. Since 2022 I've worked in a medical-surgical ICU, where I've sharpened the habit your step-down unit depends on: catching deterioration early.",
        "I hold current BLS and ACLS certifications and my CCRN, and patient and family education is a regular part of my day, especially preparing families for what recovery at home will look like.",
        "I'd welcome the chance to bring both my telemetry foundation and my critical care experience to your cardiac step-down team.",
      ],
      closing: "Sincerely,",
    },
    answers: [
      demoAnswer("b1", "Why are you interested in this role?", "I loved the cardiac focus of my first job on telemetry, and step-down lets me combine that with the critical care skills I've built in the ICU, while spending more time on patient education before discharge.", "ai"),
      demoAnswer("b2", "What makes you a strong fit for this position?", "Two years of telemetry rhythm interpretation, four years of ICU experience recognizing and escalating deterioration, and current BLS, ACLS and CCRN.", "ai"),
      demoAnswer("b3", "Are you willing to relocate?", "", "standard", "No saved answer yet"),
    ],
  },
  "summit-rapid-response": {
    coverLetter: {
      greeting: "Dear Summit Regional Hospital Rapid Response Team,",
      paragraphs: [
        "On my ICU unit at St. Anne's, I'm a member of the rapid response team and have led more than 30 calls: assessing, stabilizing, and coordinating escalation for patients whose condition changed fast. Your Rapid Response Nurse role would let me do that work hospital-wide.",
        "My background combines four years of critical care with two years on cardiac telemetry. I hold CCRN, BLS and ACLS, and I've coached newer nurses through high-pressure moments as a preceptor to six new graduates.",
        "Thank you for considering my application. I'd be glad to talk about how I could support your bedside teams.",
      ],
      closing: "Sincerely,",
    },
    answers: [
      demoAnswer("c1", "How many years of critical care experience do you have?", "Four years in a medical-surgical ICU (since March 2022), plus 20 months on cardiac telemetry.", "ai"),
      demoAnswer("c2", "Are you subject to a non-compete agreement?", "No", "standard"),
    ],
  },
};

/** Summit is deliberately left out so visitors can watch a draft get "tailored" live. */
export const DEMO_TRACKER_SEED: { jobId: string; status: ApplicationView["status"]; appliedDaysAgo: number | null }[] = [
  { jobId: "riverside-icu-rn", status: "interview", appliedDaysAgo: 12 },
  { jobId: "lakeview-cardiac-stepdown", status: "applied", appliedDaysAgo: 9 },
];
