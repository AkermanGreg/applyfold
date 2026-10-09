import {
  BadgeCheck,
  FileText,
  Hand,
  ListChecks,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { WaitlistForm } from "@/components/waitlist-form";
import { brand } from "@/lib/brand";
import { PLAN_ORDER, PLANS } from "@/lib/plans";

const audiences = [
  "Nurses",
  "Teachers",
  "Sales reps",
  "Marketers",
  "Electricians",
  "Office managers",
  "Customer support",
  "Developers",
];

const steps = [
  {
    icon: FileText,
    title: "Upload your resume once",
    body: "We turn it into a profile you can read and edit. Missing details are asked once, then remembered.",
  },
  {
    icon: Search,
    title: "See roles that actually fit",
    body: "Matches from public job boards, each with a fit score and one line on why it suits you.",
  },
  {
    icon: Sparkles,
    title: "Get a tailored draft in one click",
    body: "A cover letter and answers to that posting's questions, in your voice, using only facts from your profile.",
  },
  {
    icon: UserCheck,
    title: "Review, approve, apply",
    body: "Copy answers into the employer's form from a side panel. On Autopilot, watch the assistant fill it in for you.",
  },
];

const principles = [
  {
    icon: BadgeCheck,
    title: "Truthful, always",
    body: "Drafts never invent experience, degrees or dates. If something is unknown, you're asked. Never guessed.",
  },
  {
    icon: ListChecks,
    title: "Quality over volume",
    body: "No spray-and-pray. Fewer, better applications that read like you wrote them on a good day.",
  },
  {
    icon: Hand,
    title: "You stay in control",
    body: "Nothing is submitted without your approval. Logins and captchas are handed to you, never bypassed.",
  },
  {
    icon: Lock,
    title: "Your data is yours",
    body: "Profile and answers are encrypted at rest. Export or delete everything at any time.",
  },
];

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-accent" aria-hidden="true" />
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">Registered Nurse, ICU (Nights)</p>
            <p className="text-sm text-muted-foreground">Riverside Health · Columbus, OH</p>
          </div>
          <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
            92% fit
          </span>
        </div>
        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm">
          <span className="font-medium">Why it fits:</span> 4 years of ICU experience, BLS and ACLS current, and
          you’re open to night shifts.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Are you authorized to work in the US without sponsorship?
            </p>
            <p className="mt-1 text-sm">Yes</p>
            <span className="mt-1 inline-block rounded bg-accent px-1.5 py-0.5 text-[11px] text-accent-foreground">
              From your saved answers
            </span>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Describe a time you handled a rapid patient deterioration.
            </p>
            <p className="mt-1 text-sm leading-relaxed">
              On a night shift at St. Anne’s, a post-op patient’s pressure dropped sharply. I escalated to the
              rapid response team, started fluids per protocol, and stayed with the family while…
            </p>
            <span className="mt-1 inline-block rounded bg-brand-warm/40 px-1.5 py-0.5 text-[11px] text-brand-warm-foreground">
              Drafted from your profile · edit before sending
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Badge variant="secondary" className="w-fit">
              Now in early access
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Job applications that sound like you, not like a bot.
            </h1>
            <p className="max-w-xl text-lg text-pretty text-muted-foreground">
              {brand.name} knows your background, finds roles that actually fit, and drafts every application
              with specific, truthful answers. You review, you approve, it submits.
            </p>
            <WaitlistForm id="hero" />
          </div>
          <ProductPreview />
        </section>

        <section aria-labelledby="audience-heading" className="border-y bg-muted/40">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 sm:px-6">
            <h2 id="audience-heading" className="text-sm font-medium text-muted-foreground">
              Built for every job search, not just tech
            </h2>
            <ul className="flex flex-wrap justify-center gap-2">
              {audiences.map((audience) => (
                <li key={audience} className="rounded-full border bg-background px-3 py-1 text-sm">
                  {audience}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            The same 40 form fields and the same &ldquo;tell us about a time when&rdquo; essays, done once and done
            well.
          </p>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <step.icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm text-muted-foreground">Step {index + 1}</span>
                </div>
                <h3 className="mt-4 font-medium">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="principles" className="scroll-mt-20 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5" aria-hidden="true" />
              <h2 className="text-3xl font-semibold tracking-tight">The opposite of an auto-apply bot</h2>
            </div>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {principles.map((principle) => (
                <div key={principle.title}>
                  <principle.icon className="size-5 text-brand-warm" aria-hidden="true" />
                  <h3 className="mt-3 font-medium">{principle.title}</h3>
                  <p className="mt-1 text-sm text-primary-foreground/80">{principle.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Simple pricing</h2>
          <p className="mt-2 text-muted-foreground">Start free. Upgrade when your search picks up.</p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {PLAN_ORDER.map((id) => {
              const plan = PLANS[id];
              const featured = id === "pro";
              return (
                <div
                  key={id}
                  className={`flex flex-col rounded-2xl border bg-card p-6 ${featured ? "border-primary ring-1 ring-primary" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{plan.name}</h3>
                    {plan.comingSoon ? <Badge variant="outline">Coming soon</Badge> : null}
                    {featured ? <Badge>Most popular</Badge> : null}
                  </div>
                  <p className="mt-4 text-3xl font-semibold tracking-tight">{plan.priceLabel}</p>
                  <p className="min-h-5 text-sm text-muted-foreground">{plan.priceNote ?? ""}</p>
                  <p className="mt-3 text-sm">{plan.pitch}</p>
                  <ul className="mt-5 flex flex-col gap-2 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section id="waitlist" className="scroll-mt-20 border-t bg-muted/40">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 py-20 text-center sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight">Get early access</h2>
            <p className="text-muted-foreground">
              We’re inviting people in batches. Tell us your field so we can prioritize the right job sources.
            </p>
            <WaitlistForm id="footer" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
