"use client";

import { BellRing } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";

import type { ApplicationStatus } from "@/lib/applications";

export type TrackerCard = {
  applicationId: string;
  jobId: string;
  status: ApplicationStatus;
  title: string;
  company: string;
  appliedAt: string | null;
  followUpAt: string | null;
};

const COLUMNS: { id: string; title: string; statuses: ApplicationStatus[] }[] = [
  { id: "saved", title: "Saved", statuses: ["saved"] },
  { id: "applied", title: "Applied", statuses: ["applied"] },
  { id: "interview", title: "Interview", statuses: ["interview"] },
  { id: "offer", title: "Offer", statuses: ["offer"] },
  { id: "closed", title: "Closed", statuses: ["rejected", "withdrawn"] },
];

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export function TrackerBoard({
  items,
  basePath,
  today,
  onStatusChange,
}: {
  items: TrackerCard[];
  basePath: string;
  /** Passed in (not read from the clock here) so server and client render the same thing. */
  today: string;
  onStatusChange: (applicationId: string, status: ApplicationStatus) => Promise<void>;
}) {
  const [, startTransition] = useTransition();
  const [optimistic, apply] = useOptimistic(items, (current, update: { id: string; status: ApplicationStatus }) =>
    current.map((item) => (item.applicationId === update.id ? { ...item, status: update.status } : item)),
  );

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        Applications you tailor show up here. Start from the{" "}
        <Link href={basePath} className="text-primary underline">
          job feed
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="grid min-w-[900px] grid-cols-5 gap-3">
        {COLUMNS.map((column) => {
          const cards = optimistic.filter((item) => column.statuses.includes(item.status));
          return (
            <section key={column.id} aria-labelledby={`col-${column.id}`} className="flex flex-col gap-2 rounded-xl bg-muted/60 p-2">
              <h2 id={`col-${column.id}`} className="px-1 py-1 text-sm font-medium">
                {column.title} <span className="text-muted-foreground">{cards.length}</span>
              </h2>
              {cards.map((card) => {
                const followUpDue = card.status === "applied" && card.followUpAt && card.followUpAt <= today;
                return (
                  <article key={card.applicationId} className="flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm">
                    <Link href={`${basePath}/${card.jobId}`} className="font-medium hover:underline">
                      {card.title}
                    </Link>
                    <p className="text-muted-foreground">{card.company}</p>
                    {card.appliedAt ? <p className="text-xs text-muted-foreground">Applied {shortDate(card.appliedAt)}</p> : null}
                    {followUpDue ? (
                      <p className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                        <BellRing className="size-3.5" aria-hidden="true" /> Time to follow up
                      </p>
                    ) : null}
                    <label className="sr-only" htmlFor={`status-${card.applicationId}`}>
                      Status for {card.title}
                    </label>
                    <select
                      id={`status-${card.applicationId}`}
                      value={card.status}
                      onChange={(event) => {
                        const status = event.target.value as ApplicationStatus;
                        startTransition(async () => {
                          apply({ id: card.applicationId, status });
                          await onStatusChange(card.applicationId, status);
                        });
                      }}
                      className="h-8 rounded-md border bg-background px-2 text-xs"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
}
