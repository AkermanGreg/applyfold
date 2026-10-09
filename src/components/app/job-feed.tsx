"use client";

import { Bookmark, BookmarkCheck, ExternalLink, EyeOff, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { FeedItem, MatchStatus } from "@/lib/feed";
import { cn } from "@/lib/utils";

import { formatPosted, formatSalary, REMOTE_LABEL, scoreTone } from "./format";

const TABS: { status: MatchStatus; label: string }[] = [
  { status: "new", label: "New" },
  { status: "saved", label: "Saved" },
  { status: "applied", label: "Applied" },
  { status: "skipped", label: "Skipped" },
];

function MatchCard({
  item,
  href,
  onStatus,
}: {
  item: FeedItem;
  href: string;
  onStatus: (status: MatchStatus) => void;
}) {
  const salary = formatSalary(item.salaryMin, item.salaryMax, item.salaryCurrency);
  const posted = formatPosted(item.postedAt);
  const remote = REMOTE_LABEL[item.remote];
  const meta = [item.location, remote, salary, posted].filter(Boolean);

  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-4">
        <span
          className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg text-sm font-semibold", scoreTone(item.score))}
          aria-label={`Fit score ${item.score} out of 100`}
        >
          {item.score}
        </span>
        <div className="min-w-0">
          <Link href={href} className="font-medium hover:underline">
            {item.title}
          </Link>
          <p className="text-sm text-muted-foreground">
            {item.company}
            {meta.length ? ` · ${meta.join(" · ")}` : ""}
          </p>
          <p className="mt-1.5 text-sm">{item.reason}</p>
          {item.attribution ? (
            <a href={item.attribution.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline">
              {item.attribution.label} <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 gap-2 sm:flex-col sm:items-end">
        <Button asChild size="sm">
          <Link href={href}>Tailor &amp; apply</Link>
        </Button>
        {item.status === "new" ? (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => onStatus("saved")}>
              <Bookmark aria-hidden="true" /> Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onStatus("skipped")}>
              <EyeOff aria-hidden="true" /> Skip
            </Button>
          </div>
        ) : item.status === "skipped" || item.status === "saved" ? (
          <Button size="sm" variant="ghost" onClick={() => onStatus("new")}>
            {item.status === "saved" ? <BookmarkCheck aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
            {item.status === "saved" ? "Unsave" : "Restore"}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

/**
 * The match feed. Data and the status action come in as props so demo mode can render the
 * exact same UI over fixtures with a local-state action.
 */
export function JobFeed({
  items,
  basePath,
  onStatusChange,
  emptyState,
}: {
  items: FeedItem[];
  basePath: string;
  onStatusChange: (jobId: string, status: MatchStatus) => Promise<void>;
  emptyState?: React.ReactNode;
}) {
  const [tab, setTab] = useState<MatchStatus>("new");
  const [, startTransition] = useTransition();
  const [optimistic, applyOptimistic] = useOptimistic(items, (current, update: { jobId: string; status: MatchStatus }) =>
    current.map((item) => (item.jobId === update.jobId ? { ...item, status: update.status } : item)),
  );

  const changeStatus = (jobId: string, status: MatchStatus) =>
    startTransition(async () => {
      applyOptimistic({ jobId, status });
      await onStatusChange(jobId, status);
    });

  const visible = optimistic.filter((item) => item.status === tab);

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Filter jobs" className="flex flex-wrap gap-2">
        {TABS.map(({ status, label }) => {
          const count = optimistic.filter((item) => item.status === status).length;
          return (
            <button
              key={status}
              role="tab"
              aria-selected={tab === status}
              onClick={() => setTab(status)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                tab === status ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {label} <span className="opacity-70">{count}</span>
            </button>
          );
        })}
      </div>
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {tab === "new" && emptyState ? emptyState : `Nothing in ${TABS.find((t) => t.status === tab)?.label} yet.`}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((item) => (
            <MatchCard
              key={item.jobId}
              item={item}
              href={`${basePath}/${item.jobId}`}
              onStatus={(status) => changeStatus(item.jobId, status)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
