"use client";

import { Bookmark, BookmarkCheck, ExternalLink, EyeOff, MapPin, RotateCcw, Sparkles, Wallet } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { FeedItem, MatchStatus } from "@/lib/feed";
import { cn } from "@/lib/utils";

import { CompanyAvatar } from "./company-avatar";
import { formatPosted, formatSalary, REMOTE_LABEL } from "./format";
import { ScoreRing } from "./score-ring";

const TABS: { status: MatchStatus; label: string }[] = [
  { status: "new", label: "New" },
  { status: "saved", label: "Saved" },
  { status: "applied", label: "Applied" },
  { status: "skipped", label: "Skipped" },
];

export function Chip({ icon: Icon, children }: { icon?: typeof MapPin; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
      {Icon ? <Icon className="size-3" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

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

  return (
    <li className="surface flex items-start gap-4 p-5 transition-shadow hover:shadow-md">
      <CompanyAvatar name={item.company} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={href} className="font-semibold leading-snug hover:underline">
              {item.title}
            </Link>
            <p className="text-sm text-muted-foreground">{item.company}</p>
          </div>
          <ScoreRing score={item.score} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.location ? <Chip icon={MapPin}>{item.location}</Chip> : null}
          {remote ? <Chip>{remote}</Chip> : null}
          {salary ? <Chip icon={Wallet}>{salary}</Chip> : null}
          {posted ? <Chip>{posted}</Chip> : null}
        </div>
        <p className="mt-3 flex gap-2 text-sm">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{item.reason}</span>
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button asChild size="sm">
            <Link href={href}>Tailor &amp; apply</Link>
          </Button>
          {item.status === "new" ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => onStatus("saved")}>
                <Bookmark aria-hidden="true" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onStatus("skipped")}>
                <EyeOff aria-hidden="true" /> Not for me
              </Button>
            </>
          ) : item.status === "skipped" || item.status === "saved" ? (
            <Button size="sm" variant="ghost" onClick={() => onStatus("new")}>
              {item.status === "saved" ? <BookmarkCheck aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
              {item.status === "saved" ? "Unsave" : "Restore"}
            </Button>
          ) : null}
          {item.attribution ? (
            <a
              href={item.attribution.url}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
            >
              {item.attribution.label} <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          ) : null}
        </div>
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
      <div role="tablist" aria-label="Filter jobs" className="flex w-fit gap-1 rounded-xl bg-muted p-1">
        {TABS.map(({ status, label }) => {
          const count = optimistic.filter((item) => item.status === status).length;
          return (
            <button
              key={status}
              role="tab"
              aria-selected={tab === status}
              onClick={() => setTab(status)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition-colors",
                tab === status ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label} <span className="ml-0.5 tabular-nums opacity-60">{count}</span>
            </button>
          );
        })}
      </div>
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-background p-10 text-center text-sm text-muted-foreground">
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
