# Applyfold: plan and decisions

Confirmed 2026-10-08. Each decision lists the alternative we rejected and why, which feeds the
Phase 4 case study.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Web | Next.js 16.4 (App Router, Cache Components), TypeScript, Tailwind v4, shadcn/ui | Current stable; static marketing shell with streamed signed-in UI. |
| Runtime | Node 24 | Vercel no longer accepts Node 20 for new deploys (Oct 2026); Next 16 needs ≥ 20.9. |
| Auth | Clerk (Vercel Marketplace) | Prebuilt UI, Vercel-native billing; its user id doubles as the RevenueCat app user id. Supabase Auth only wins if the DB is Supabase too. |
| DB | Neon Postgres (Vercel Marketplace) + Drizzle | Vercel Postgres no longer exists. Drizzle gives typed schema + SQL migrations. |
| Files | Vercel Blob, **private** store | Private access is set per store and can't be changed later. Resumes and PDFs never get public URLs. |
| AI | Claude Opus 5.5 for drafting; Claude Haiku 5.5 for scoring/classification | Opus writes; Haiku is ~40x cheaper for high-volume fit scoring. Structured outputs via zod; prompt caching on the profile block. |
| Apply agent (Phase 2) | Claude API tool loop, one turn per Vercel Workflow step | Agent SDK spawns a CLI subprocess with local disk and built-in tools we'd disable; a plain loop runs serverless, survives a long human hand-off as a durable wait, and lets safety gates live in deterministic tool code. |
| Jobs/queue | Vercel Workflow (workflow-sdk.dev) | Native to Vercel, durable steps, unlimited waits. Inngest/Trigger.dev add a vendor without a needed capability. |
| Browser (Phase 2) | Browserbase + Playwright over CDP | Interactive live view for hand-off. **`solveCaptchas: false` on every session** (it defaults to on). |
| Payments (Phase 3) | RevenueCat Billing (Stripe) + purchases-js | Same project can serve an iOS app later. Server-side entitlement via webhooks + `GET /v1/subscribers`. |

## Decisions made during the build

| Decision | Why |
|---|---|
| Cover-letter PDFs are rendered on demand (pdf-lib), not stored in Blob | Always reflects the user's latest edits; one less copy of PII at rest. Blob holds only uploaded resumes. |
| Authorization checked in every page and Server Action (`requireUserId`), not in proxy route matching | Layouts render in parallel with pages, and Clerk deprecated `createRouteMatcher` protection. |
| Auth and DB degrade gracefully when env vars are missing | Fresh preview deploys, CI and the demo work before integrations are connected. |
| Global AI budget guard (`AI_MONTHLY_BUDGET_USD`, default $40) + `ai_usage` log | Hard ceiling on the $100 credit; per-purpose cost data for the case study. |
| Deterministic answers before AI | Contact, eligibility and EEO questions are filled by code from saved answers; the model only writes essays and the cover letter. Cheaper, and impossible to hallucinate. |
| Pasted links: ATS APIs first, then one polite fetch with SSRF guards | DNS-resolved private ranges and every redirect hop are rejected; LinkedIn/Indeed/Glassdoor are never fetched. |
| Demo mode is fully client-side over fixtures | Recruiters can click through everything with zero API spend. |

## Product rules (from the brief, enforced in code)

- Answers are truthful but favorable, sourced from saved answers. "Authorized to work *without
  sponsorship*" resolves to work authorization, not the sponsorship rule. "Non-compete" ==
  "non-competition".
- Never invent facts. Unknowns are asked once and saved.
- Match status is user-owned and sticky; re-scoring never resurrects a skipped job.
- EEO questions default to "Decline to self-identify".
- No captcha solving, no account creation, no password typing, no LinkedIn/Indeed/Glassdoor scraping.

## Job sources

| Source | Status | Notes |
|---|---|---|
| Greenhouse, Lever, Ashby | Phase 1 | Public, no key. Greenhouse exposes application questions (`?questions=true`). Applying always happens on the employer's page. |
| USAJobs | Phase 1 | Free key. Strong non-tech coverage (VA nursing, trades). |
| Adzuna | Phase 1 | Broadest legit non-tech feed (US/UK). Attribution label required; commercial licence needed after the trial, before marketing launch. |
| Paste a link / paste text | Phase 1 | Covers everything else, including postings the user found themselves. |
| Remotive, Himalayas | Rejected | Terms forbid redistribution and using listings to gather signups. |
| The Muse | Rejected | Terms forbid replicating its service. |
| JSearch | Rejected | Resells scraped LinkedIn/Indeed data (conflicts with our non-goals). |
| Rippling | Rejected | No public API; would be scraping. |

ATS boards list only open roles, so no posted-date cutoff for them; aggregators get one.

## Pricing

| | Free | Pro | Autopilot |
|---|---|---|---|
| Price | $0 | $15/mo or $120/yr, 7-day trial | $35/mo |
| Tailored applications | 5/mo | 100/mo fair use | 100/mo fair use |
| Auto-fill runs | — | — | 40/mo |
| Digest | Weekly | Daily | Daily |

Source of truth for limits: `src/lib/plans.ts`. Paywall triggers: 6th tailored application, first
auto-fill, enabling the daily digest.

## Unit costs (estimates, Oct 2026 prices)

| Item | Cost |
|---|---|
| Tailored application (Opus 5.5, cached profile) | $0.06–0.10 |
| Resume parse (once per user) | $0.05–0.08 |
| Fit scoring (Haiku 5.5 + rules pre-filter + Batch API) | ~$0.005 / user / day |
| Auto-fill run (~25 agent turns + ~5 browser minutes) | $0.30–0.50 |
| Fixed, Phases 0–2 | ~$0 (free tiers) |
| Fixed, live | ~$41/mo (Vercel Pro $20, Browserbase $20, domain) |

Guardrails: demo mode makes zero API calls; per-user daily caps; a global monthly AI spend cap;
an Anthropic console spend limit.

## Phases

- **Phase 0, foundation:** repo, Next.js + Tailwind + shadcn, Clerk, Drizzle schema + migrations,
  env handling, CI (typecheck, lint, test, build), secret-blocking pre-commit hook, landing page
  with waitlist, draft privacy/terms.
- **Phase 1, MVP:** resume upload + AI parsing into an editable profile, preferences + standard
  answers onboarding, ingestion from Greenhouse/Lever/Ashby/USAJobs/Adzuna with scoring, job feed
  with "why it fits", tailored cover letter (PDF) + drafted answers, copy-paste apply panel,
  tracker, seeded demo mode.
- **Phase 2, apply agent:** Workflow + tool loop, safety gates, Browserbase live view, hand-off,
  success detection with before/after diff + screenshots, per-step event stream.
- **Phase 3, paywall:** RevenueCat products, paywall UI, webhooks (refund = `CANCELLATION` with
  `cancel_reason=CUSTOMER_SUPPORT`), entitlements, usage limits, billing settings.
- **Phase 4, polish:** onboarding, empty states, a11y, SEO, email digests (Resend), analytics,
  README diagram, demo video script, case study.
