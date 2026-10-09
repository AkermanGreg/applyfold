"use client";

import { AlertTriangle, Check, Copy, Download, ExternalLink, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { TailorResult } from "@/app/app/jobs/[id]/actions";
import type { ApplicationStatus, ApplicationView } from "@/lib/applications";
import type { CoverLetter } from "@/lib/tailor/pdf";
import type { AnswerSource } from "@/lib/tailor/questions";

export type ApplyPanelActions = {
  tailor: (extraQuestions: string[]) => Promise<TailorResult>;
  updateAnswer: (answerId: string, answer: string) => Promise<void>;
  saveCoverLetter: (letter: CoverLetter) => Promise<void>;
  setStatus: (status: ApplicationStatus) => Promise<void>;
};

const SOURCE_LABEL: Record<AnswerSource, string> = {
  profile: "From your profile",
  standard: "Saved answer",
  ai: "Drafted from your profile",
  user: "Edited by you",
};

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="xs"
      variant="outline"
      disabled={!text}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function AnswerRow({
  answer,
  onSave,
}: {
  answer: ApplicationView["answers"][number];
  onSave: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState(answer.answer);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [source, setSource] = useState(answer.source);

  return (
    <li className="flex flex-col gap-2 border-b py-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{answer.question}</p>
        <CopyButton text={value} />
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          <Textarea value={value} onChange={(event) => setValue(event.target.value)} rows={Math.min(10, Math.max(2, value.length / 60))} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => (setValue(answer.answer), setEditing(false))}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await onSave(value);
                  setSource("user");
                  setEditing(false);
                })
              }
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md p-1 -m-1 text-left text-sm whitespace-pre-line hover:bg-muted"
          aria-label={`Edit answer to: ${answer.question}`}
        >
          {value || <span className="text-muted-foreground italic">No answer yet. Click to write one.</span>}
        </button>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="font-normal">
          {SOURCE_LABEL[source]}
        </Badge>
        {answer.needsInput && source !== "user" ? (
          <span className="inline-flex items-center gap-1 text-xs text-amber-700">
            <AlertTriangle className="size-3.5" aria-hidden="true" /> Needs your input: {answer.needsInput}
          </span>
        ) : null}
      </div>
    </li>
  );
}

function CoverLetterEditor({
  letter,
  pdfHref,
  onSave,
}: {
  letter: CoverLetter;
  pdfHref: string | null;
  onSave: (letter: CoverLetter) => Promise<void>;
}) {
  const [text, setText] = useState([letter.greeting, ...letter.paragraphs, letter.closing].join("\n\n"));
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  const toLetter = (): CoverLetter => {
    const blocks = text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
    return { greeting: blocks[0] ?? "", paragraphs: blocks.slice(1, -1), closing: blocks.at(-1) ?? "" };
  };

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        aria-label="Cover letter"
        value={text}
        rows={16}
        onChange={(event) => (setText(event.target.value), setDirty(true))}
        className="leading-relaxed"
      />
      <div className="flex flex-wrap justify-end gap-2">
        <CopyButton text={text} label="Copy text" />
        {dirty ? (
          <Button
            size="xs"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await onSave(toLetter());
                setDirty(false);
                toast.success("Cover letter saved");
              })
            }
          >
            Save edits
          </Button>
        ) : null}
        {pdfHref ? (
          <Button asChild size="xs" variant="outline" aria-disabled={dirty}>
            <a href={dirty ? undefined : pdfHref} onClick={(event) => dirty && (event.preventDefault(), toast("Save your edits first"))}>
              <Download aria-hidden="true" /> PDF
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function ApplyPanel({
  applyUrl,
  application,
  usage,
  actions,
  pdfHref,
  upgradeHref = "/#pricing",
}: {
  /** Null in demo mode, where the employers are fictional. */
  applyUrl: string | null;
  application: ApplicationView | null;
  usage: { used: number; limit: number };
  actions: ApplyPanelActions;
  pdfHref: string | null;
  upgradeHref?: string;
}) {
  const [tab, setTab] = useState<"answers" | "letter">("answers");
  const [extra, setExtra] = useState("");
  const [pending, startTransition] = useTransition();
  const [problem, setProblem] = useState<Extract<TailorResult, { ok: false }> | null>(null);
  const remaining = Math.max(0, usage.limit - usage.used);

  const tailor = () =>
    startTransition(async () => {
      setProblem(null);
      const result = await actions.tailor(extra.split("\n"));
      if (!result.ok) setProblem(result);
      else toast.success("Draft ready. Review it before you send.");
    });

  const markApplied = () =>
    startTransition(async () => {
      await actions.setStatus("applied");
      toast.success("Moved to Applied. We’ll remind you to follow up in a week.");
    });

  return (
    <aside className="flex flex-col gap-4 rounded-2xl border bg-card p-5 lg:sticky lg:top-20">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium">Your application</h2>
        <span className="text-xs text-muted-foreground">
          {remaining} of {usage.limit} drafts left this month
        </span>
      </div>

      {problem ? (
        <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {problem.message}{" "}
          {problem.code === "limit" ? (
            <Link href={upgradeHref} className="font-medium underline">
              See Pro
            </Link>
          ) : problem.code === "profile" ? (
            <Link href="/app/profile" className="font-medium underline">
              Add your resume
            </Link>
          ) : null}
        </div>
      ) : null}

      {!application ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Get a cover letter and answers written from your real experience. Nothing is sent anywhere until you
            choose to apply.
          </p>
          <label htmlFor="extra-questions" className="text-sm font-medium">
            Questions from the application <span className="font-normal text-muted-foreground">(optional, one per line)</span>
          </label>
          <Textarea
            id="extra-questions"
            rows={3}
            value={extra}
            onChange={(event) => setExtra(event.target.value)}
            placeholder="Why do you want to work here?"
          />
          <Button onClick={tailor} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
            {pending ? "Writing your draft… (about 30s)" : "Tailor my application"}
          </Button>
        </div>
      ) : (
        <>
          <div role="tablist" className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
            {(
              [
                ["answers", `Answers (${application.answers.length})`],
                ["letter", "Cover letter"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`flex-1 rounded-md px-3 py-1.5 ${tab === id ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === "answers" ? (
            application.answers.length ? (
              <ul className="max-h-[60vh] overflow-y-auto pr-1">
                {application.answers.map((answer) => (
                  <AnswerRow key={answer.id} answer={answer} onSave={(value) => actions.updateAnswer(answer.id, value)} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">This posting didn’t ask extra questions.</p>
            )
          ) : application.coverLetter ? (
            <CoverLetterEditor letter={application.coverLetter} pdfHref={pdfHref} onSave={actions.saveCoverLetter} />
          ) : null}
          <div className="flex flex-col gap-2 border-t pt-4">
            {applyUrl ? (
              <Button asChild>
                <a href={applyUrl} target="_blank" rel="noreferrer">
                  Open the application <ExternalLink aria-hidden="true" />
                </a>
              </Button>
            ) : (
              <Button disabled>Employer site (not available in the demo)</Button>
            )}
            {application.status === "saved" ? (
              <Button variant="outline" onClick={markApplied} disabled={pending}>
                <Check aria-hidden="true" /> I’ve applied
              </Button>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Status: <span className="font-medium capitalize text-foreground">{application.status}</span>
              </p>
            )}
            <Button variant="ghost" size="sm" onClick={tailor} disabled={pending}>
              {pending ? "Rewriting…" : "Regenerate draft (uses 1 credit)"}
            </Button>
          </div>
        </>
      )}
    </aside>
  );
}
