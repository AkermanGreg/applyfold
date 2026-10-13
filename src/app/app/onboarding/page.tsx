import { currentUser } from "@clerk/nextjs/server";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { skipOnboardingAction, finishOnboardingAction, saveBasicsAction, savePreferencesStepAction } from "@/app/actions/onboarding";
import { uploadResume } from "@/app/actions/profile";
import { PreferencesForm } from "@/components/app/preferences-form";
import { ResumeUpload } from "@/components/app/resume-upload";
import { BasicsForm, QuickAnswersForm } from "@/components/onboarding/onboarding-forms";
import { ONBOARDING_STEPS, Stepper } from "@/components/onboarding/stepper";
import { getSavedAnswers } from "@/lib/answers/store";
import { getPreferences } from "@/lib/preferences-store";
import { getProfileRecord } from "@/lib/profile/store";
import { requireAppUser } from "@/lib/session";

export const metadata = { title: "Get set up" };
// The resume step parses with Claude; preferences kick off a job search in after().
export const maxDuration = 120;

function StepCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="surface p-6 sm:p-8">
      <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export default async function OnboardingPage({ searchParams }: PageProps<"/app/onboarding">) {
  const { userId } = await requireAppUser();
  const raw = Number((await searchParams).step);
  const step = Number.isInteger(raw) && raw >= 1 && raw <= ONBOARDING_STEPS.length ? raw : 1;

  let content: ReactNode;
  if (step === 1) {
    const record = await getProfileRecord(userId);
    content = (
      <StepCard
        title="Let’s start with your resume"
        description="We’ll read it and build your profile, so every application uses your real experience. Nothing is ever invented."
      >
        <ResumeUpload action={uploadResume} currentFilename={record.resumeFilename} nextHref="/app/onboarding?step=2" />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          No resume handy?{" "}
          <Link href="/app/onboarding?step=2" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            Fill in the basics instead <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </p>
      </StepCard>
    );
  } else if (step === 2) {
    const [{ profile }, clerkUser] = await Promise.all([getProfileRecord(userId), currentUser()]);
    const contact = profile?.contact;
    content = (
      <StepCard title="Check the basics" description="Employers ask for these on every form. Confirm we got them right.">
        <BasicsForm
          action={saveBasicsAction}
          initial={{
            fullName: contact?.fullName ?? clerkUser?.fullName ?? null,
            email: contact?.email ?? clerkUser?.primaryEmailAddress?.emailAddress ?? null,
            phone: contact?.phone ?? null,
            location: contact?.location ?? null,
            postalCode: contact?.postalCode ?? null,
            headline: profile?.headline ?? null,
          }}
        />
      </StepCard>
    );
  } else if (step === 3) {
    const preferences = await getPreferences(userId);
    content = (
      <StepCard
        title="What are you looking for?"
        description="We search job boards for these roles and score every posting against your profile."
      >
        <PreferencesForm initial={preferences} action={savePreferencesStepAction} submitLabel="Continue" />
      </StepCard>
    );
  } else {
    const saved = await getSavedAnswers(userId);
    content = (
      <StepCard
        title="Four quick answers"
        description="Almost every application asks these. Answer once and we’ll fill them in for you, worded to match each form."
      >
        <QuickAnswersForm action={finishOnboardingAction} saved={saved} />
      </StepCard>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Stepper current={step} />
        </div>
        <form action={skipOnboardingAction}>
          <button type="submit" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            Skip for now
          </button>
        </form>
      </div>
      {content}
    </div>
  );
}
