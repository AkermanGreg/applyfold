import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CalendarCheck,
  FileText,
  Hand,
  ListChecks,
  Lock,
  PartyPopper,
  Search,
  Sparkles,
  UserCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ScoreRing } from "@/components/app/score-ring";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { WaitlistForm } from "@/components/waitlist-form";
import { brand } from "@/lib/brand";
import { PHOTOS } from "@/lib/photos";
import { PLAN_ORDER, PLANS } from "@/lib/plans";

const roles = [
  { photo: PHOTOS.nurse, role: "Registered Nurse", fit: 94 },
  { photo: PHOTOS.teacher, role: "Elementary Teacher", fit: 88 },
  { photo: PHOTOS.trades, role: "Electrician", fit: 91 },
  { photo: PHOTOS.office, role: "Account Manager", fit: 86 },
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
    body: "Matches from real job boards, each with a fit score and one line on why it suits you.",
  },
  {
    icon: Sparkles,
    title: "Get a tailored draft in one click",
    body: "A cover letter and answers to that posting’s questions, in your voice, using only facts from your profile.",
  },
  {
    icon: UserCheck,
    title: "Review, approve, apply",
    body: "Copy answers into the employer’s form from a side panel, then track every application to the offer.",
  },
];

const principles = [
  {
    icon: BadgeCheck,
    title: "Truthful, always",
    body: "Drafts never invent experience, degrees or dates. If something’s unknown, you’re asked. Never guessed.",
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
    body: "Your profile and answers are encrypted at rest. Export or delete everything at any time.",
  },
];

function FloatingCard({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div className={`absolute flex items-center gap-3 rounded-2xl border bg-card/95 px-4 py-3 shadow-xl backdrop-blur ${className}`}>
      {children}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 right-[-10%] size-[42rem] rounded-full bg-coral/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-20%] left-[-10%] size-[30rem] rounded-full bg-brand-warm/60 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-14 pb-20 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col gap-7">
          <span className="w-fit rounded-full border border-coral/30 bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
            For nurses, teachers, trades, sales, office and tech
          </span>
          <h1 className="font-display text-5xl leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Your next <span className="text-primary italic">“you’re hired”</span> starts here.
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground">
            {brand.name} finds roles that actually fit you and writes every application with specific, truthful answers
            from your own experience. You review, you approve, you get the interview.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6 text-base shadow-lg shadow-primary/25">
              <Link href="/sign-up">
                Get started free <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 bg-card px-6 text-base">
              <Link href="/demo">Try the live demo</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Free plan · no credit card · set up in about 2 minutes</p>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-2xl shadow-ink/20">
            <Image
              src={PHOTOS.heroGoodNews.src}
              alt={PHOTOS.heroGoodNews.alt}
              fill
              priority
              sizes="(min-width: 1024px) 512px, 90vw"
              className="object-cover"
            />
          </div>
          <FloatingCard className="-left-4 top-8 sm:-left-10">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent text-primary">
              <CalendarCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Interview request</p>
              <p className="text-xs text-muted-foreground">Riverside Health · Thu 10:00</p>
            </div>
          </FloatingCard>
          <FloatingCard className="-right-3 top-1/2 sm:-right-8">
            <ScoreRing score={92} size={44} />
            <div>
              <p className="text-sm font-semibold">Strong fit</p>
              <p className="text-xs text-muted-foreground">ICU Nurse · 4 yrs match</p>
            </div>
          </FloatingCard>
          <FloatingCard className="bottom-6 -left-2 sm:-left-6">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <PartyPopper className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Offer received</p>
              <p className="text-xs text-muted-foreground">Starts in two weeks</p>
            </div>
          </FloatingCard>
        </div>
      </div>
    </section>
  );
}

function Roles() {
  return (
    <section aria-labelledby="roles-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <h2 id="roles-heading" className="font-display text-4xl tracking-tight sm:text-5xl">
          Built for every job search, not just tech
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Hospitals, schools, job sites, sales floors and offices. If there’s an application, we’ll help you nail it.
        </p>
      </div>
      <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {roles.map(({ photo, role, fit }) => (
          <li key={role} className="group relative aspect-[3/4] overflow-hidden rounded-3xl">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 280px, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent p-4 pt-16">
              <div className="flex flex-col items-start gap-1.5 rounded-xl bg-card/95 px-3 py-2.5 backdrop-blur">
                <span className="text-sm leading-tight font-semibold">{role}</span>
                <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-ink-foreground">
                  {fit}% fit
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-white/10 bg-card p-5 text-card-foreground shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">Registered Nurse, ICU (Nights)</p>
            <p className="text-sm text-muted-foreground">Riverside Health · Columbus, OH</p>
          </div>
          <ScoreRing score={92} size={44} />
        </div>
        <p className="mt-3 rounded-xl bg-accent px-3 py-2 text-sm">
          <span className="font-semibold text-accent-foreground">Why it fits:</span> 4 years of ICU experience, BLS and ACLS
          current, and you’re open to night shifts.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Authorized to work in the US without sponsorship?
            </p>
            <p className="mt-1 text-sm">Yes</p>
            <span className="mt-1 inline-block rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
              From your saved answers
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Describe a time you handled a rapid patient deterioration.
            </p>
            <p className="mt-1 text-sm leading-relaxed">
              On a night shift at St. Anne’s, a post-op patient’s pressure dropped sharply. I escalated to the rapid
              response team, started fluids per protocol, and stayed with the family while…
            </p>
            <span className="mt-1 inline-block rounded-md bg-brand-warm px-1.5 py-0.5 text-[11px] text-brand-warm-foreground">
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
        <Hero />
        <Roles />

        <section id="how-it-works" className="scroll-mt-20 border-y bg-card">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="font-display text-4xl tracking-tight sm:text-5xl">From resume to interview in four steps</h2>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              The same 40 form fields and the same “tell us about a time when” essays, done once and done well.
            </p>
            <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <li key={step.title} className="relative">
                  <span className="font-display text-6xl text-coral/40">{index + 1}</span>
                  <div className="mt-2 flex items-center gap-2">
                    <step.icon className="size-5 text-primary" aria-hidden="true" />
                    <h3 className="font-semibold">{step.title}</h3>
                  </div>
                  <p className="mt-2 text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-ink text-ink-foreground">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-4xl tracking-tight sm:text-5xl">Answers that sound like you on your best day</h2>
              <p className="mt-4 text-lg text-ink-foreground/75">
                Every draft cites your real experience: the shifts you worked, the classes you taught, the numbers you hit.
                Screening questions are answered from what you told us once, worded to match each employer’s form.
              </p>
              <ul className="mt-8 flex flex-col gap-3">
                {["Cover letters as PDF, ready for any applicant system", "One-click copy for every answer", "Flags anything we’d need you to confirm"].map(
                  (item) => (
                    <li key={item} className="flex gap-3">
                      <BadgeCheck className="mt-0.5 size-5 shrink-0 text-coral" aria-hidden="true" />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>
            <ProductPreview />
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div className="relative order-last aspect-[4/3] overflow-hidden rounded-3xl shadow-xl lg:order-first">
            <Image src={PHOTOS.offerHandshake.src} alt={PHOTOS.offerHandshake.alt} fill sizes="(min-width: 1024px) 560px, 90vw" className="object-cover" />
          </div>
          <div>
            <h2 className="font-display text-4xl tracking-tight sm:text-5xl">Walk in prepared. Walk out with an offer.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Your tracker keeps every application in one place, from saved to interview to offer, and nudges you to follow up
              a week after you apply so nothing goes quiet.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="surface flex items-center gap-3 p-4">
                <BellRing className="size-5 text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">Follow-up reminders</span>
              </div>
              <div className="surface flex items-center gap-3 p-4">
                <CalendarCheck className="size-5 text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">Interview to offer, tracked</span>
              </div>
            </div>
          </div>
        </section>

        <section id="principles" className="scroll-mt-20 border-y bg-card">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="font-display text-4xl tracking-tight sm:text-5xl">The opposite of an auto-apply bot</h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {principles.map((principle) => (
                <div key={principle.title}>
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-primary">
                    <principle.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-semibold">{principle.title}</h3>
                  <p className="mt-1 text-muted-foreground">{principle.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <h2 className="font-display text-4xl tracking-tight sm:text-5xl">Simple pricing</h2>
          <p className="mt-3 text-lg text-muted-foreground">Start free. Upgrade when your search picks up.</p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {PLAN_ORDER.map((id) => {
              const plan = PLANS[id];
              const featured = id === "pro";
              return (
                <div
                  key={id}
                  className={`surface flex flex-col p-7 ${featured ? "border-primary shadow-xl shadow-primary/10 ring-1 ring-primary" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{plan.name}</h3>
                    {plan.comingSoon ? (
                      <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">Coming soon</span>
                    ) : null}
                    {featured ? (
                      <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">Most popular</span>
                    ) : null}
                  </div>
                  <p className="mt-4 font-display text-5xl tracking-tight">{plan.priceLabel}</p>
                  <p className="min-h-5 text-sm text-muted-foreground">{plan.priceNote ?? ""}</p>
                  <p className="mt-3 text-sm">{plan.pitch}</p>
                  <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant={featured ? "default" : "outline"} className="mt-6 h-11 w-full">
                    <Link href={plan.comingSoon ? "#waitlist" : "/sign-up"}>
                      {plan.comingSoon ? "Get notified" : id === "free" ? "Get started free" : "Start with Pro"}
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="relative isolate overflow-hidden">
          <Image src={PHOTOS.celebrate.src} alt="" fill sizes="100vw" className="-z-10 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/95 via-ink/85 to-ink/40" aria-hidden="true" />
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-24 text-ink-foreground sm:px-6">
            <h2 className="max-w-xl font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">
              The job you want is out there. Let’s go get it.
            </h2>
            <p className="max-w-lg text-lg text-ink-foreground/80">
              Upload your resume and see your first matches in about two minutes. Free to start.
            </p>
            <Button asChild size="lg" className="h-12 px-6 text-base shadow-lg shadow-black/20">
              <Link href="/sign-up">
                Get started free <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>

        <section id="waitlist" className="scroll-mt-20 bg-card">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 py-20 text-center sm:px-6">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">Coming soon</span>
            <h2 className="font-display text-4xl tracking-tight sm:text-5xl">Autopilot fills the forms for you</h2>
            <p className="text-muted-foreground">
              Watch the assistant fill real application forms in a live browser, then approve before anything is sent. Get an
              email when it launches.
            </p>
            <WaitlistForm id="footer" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
