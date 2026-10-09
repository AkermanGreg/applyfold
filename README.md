# Applyfold

An AI job-search and application assistant for every job seeker: nurses, teachers, marketers,
sales, trades and office roles, not only developers.

> Knows your background, finds roles that actually fit, and drafts every application with specific,
> truthful answers. You review, you approve, it submits. Anything that needs a human (captcha, login)
> is handed to you in one click.

**Status:** Phase 0 (foundation) and Phase 1 (MVP) built. Try the no-signup demo at `/demo`.
See [docs/PLAN.md](docs/PLAN.md) for the roadmap, stack decisions and unit costs.

## What works today

- Resume upload (PDF/DOCX) parsed by Claude into an editable profile
- Preferences and screening answers, asked once and reused on every form
- Job feed from Greenhouse, Lever, Ashby, USAJobs and Adzuna, scored with a one-line "why it fits"
- Add any job by link or pasted text
- One-click tailored cover letter (PDF) and answers, with a copy-paste apply panel
- Tracker with follow-up reminders
- Demo mode with a sample nurse's data (no sign-up, no AI calls)

## Principles

- **Truthful answers only.** Drafts use facts from your profile; unknowns are asked once, never guessed.
- **You approve every submission.** No spray-and-pray, no captcha solving, no account creation on your behalf.
- **Legal sources only.** Public ATS job-board APIs and aggregator APIs whose terms allow it.

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind v4 + shadcn/ui · Clerk ·
Neon Postgres + Drizzle · Vercel Blob · Claude API · Vercel Workflow · Browserbase · RevenueCat.

## Local development

Requires Node 24 (`nvm use`) and pnpm (`corepack enable pnpm`).

```bash
pnpm install
vercel link && vercel env pull .env.local   # pulls DATABASE_URL, Clerk keys, etc.
pnpm db:migrate
pnpm dev
```

Without env vars the marketing pages still run; sign-in and the waitlist explain what's missing.

| Command | What it does |
|---|---|
| `pnpm check` | typecheck + lint + unit tests (same as CI, minus the build) |
| `pnpm db:generate` | create a SQL migration from `src/db/schema.ts` |
| `pnpm db:migrate` | apply migrations to `DATABASE_URL` |

Secrets live only in Vercel environment variables. A pre-commit hook
(`scripts/check-secrets.mjs`) blocks env files and credential-shaped strings.
