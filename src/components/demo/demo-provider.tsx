"use client";

import { createContext, use, useMemo, useState, type ReactNode } from "react";

import type { ApplicationStatus, ApplicationView } from "@/lib/applications";
import { DEMO_DRAFTS, DEMO_JOBS, DEMO_TRACKER_SEED } from "@/lib/demo/fixtures";
import type { FeedItem, MatchStatus } from "@/lib/feed";
import type { CoverLetter } from "@/lib/tailor/pdf";

const DAY = 86_400_000;
const DEMO_LIMIT = 5;

type DemoApplication = ApplicationView & { jobId: string };

type DemoState = {
  now: string;
  feed: FeedItem[];
  applications: DemoApplication[];
  used: number;
  limit: number;
  setMatchStatus: (jobId: string, status: MatchStatus) => Promise<void>;
  tailor: (jobId: string) => Promise<{ ok: true } | { ok: false; code: "limit" | "error"; message: string }>;
  setApplicationStatus: (jobId: string, status: ApplicationStatus) => Promise<void>;
  updateAnswer: (jobId: string, answerId: string, answer: string) => Promise<void>;
  saveCoverLetter: (jobId: string, letter: CoverLetter) => Promise<void>;
};

const DemoContext = createContext<DemoState | null>(null);

function seedApplications(now: number): DemoApplication[] {
  return DEMO_TRACKER_SEED.map((seed) => {
    const appliedAt = seed.appliedDaysAgo == null ? null : new Date(now - seed.appliedDaysAgo * DAY);
    return {
      id: `demo-${seed.jobId}`,
      jobId: seed.jobId,
      status: seed.status,
      appliedAt,
      followUpAt: appliedAt ? new Date(appliedAt.getTime() + 7 * DAY) : null,
      ...DEMO_DRAFTS[seed.jobId]!,
    };
  });
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** All demo state lives in the browser; nothing is persisted and no API is ever called. */
export function DemoProvider({ now, children }: { now: string; children: ReactNode }) {
  const nowMs = new Date(now).getTime();
  const [applications, setApplications] = useState(() => seedApplications(nowMs));
  const [statuses, setStatuses] = useState<Record<string, MatchStatus>>(() => {
    const initial: Record<string, MatchStatus> = Object.fromEntries(DEMO_JOBS.map((job) => [job.jobId, job.status]));
    for (const seed of DEMO_TRACKER_SEED) initial[seed.jobId] = seed.status === "saved" ? "saved" : "applied";
    return initial;
  });
  const [used, setUsed] = useState(2);

  const value = useMemo<DemoState>(() => {
    const patchApplication = (jobId: string, patch: (app: DemoApplication) => DemoApplication) =>
      setApplications((current) => current.map((app) => (app.jobId === jobId ? patch(app) : app)));

    return {
      now,
      used,
      limit: DEMO_LIMIT,
      applications,
      feed: DEMO_JOBS.map(({ description: _description, ...item }) => ({ ...item, status: statuses[item.jobId] ?? item.status })),
      setMatchStatus: async (jobId, status) => setStatuses((current) => ({ ...current, [jobId]: status })),
      tailor: async (jobId) => {
        if (used >= DEMO_LIMIT) {
          return { ok: false, code: "limit", message: "That’s the free plan’s 5 drafts for the month (in the demo, too)." };
        }
        const draft = DEMO_DRAFTS[jobId];
        await pause(1_400);
        if (!draft) {
          return {
            ok: false,
            code: "error",
            message: "The demo includes drafts for the top three matches only. Sign up to tailor any job.",
          };
        }
        setUsed((count) => count + 1);
        setStatuses((current) => ({ ...current, [jobId]: current[jobId] === "new" ? "saved" : current[jobId]! }));
        setApplications((current) =>
          current.some((app) => app.jobId === jobId)
            ? current
            : [...current, { id: `demo-${jobId}`, jobId, status: "saved", appliedAt: null, followUpAt: null, ...draft }],
        );
        return { ok: true };
      },
      setApplicationStatus: async (jobId, status) => {
        const appliedAt = new Date(nowMs);
        patchApplication(jobId, (app) => ({
          ...app,
          status,
          ...(status === "applied" && !app.appliedAt ? { appliedAt, followUpAt: new Date(nowMs + 7 * DAY) } : {}),
        }));
        if (status === "applied") setStatuses((current) => ({ ...current, [jobId]: "applied" }));
      },
      updateAnswer: async (jobId, answerId, answer) =>
        patchApplication(jobId, (app) => ({
          ...app,
          answers: app.answers.map((row) => (row.id === answerId ? { ...row, answer, source: "user", needsInput: null } : row)),
        })),
      saveCoverLetter: async (jobId, letter) => patchApplication(jobId, (app) => ({ ...app, coverLetter: letter })),
    };
  }, [applications, now, nowMs, statuses, used]);

  return <DemoContext value={value}>{children}</DemoContext>;
}

export function useDemo() {
  const value = use(DemoContext);
  if (!value) throw new Error("useDemo must be used inside <DemoProvider>");
  return value;
}
