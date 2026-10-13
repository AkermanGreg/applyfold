import { AnswersForm } from "@/components/app/answers-form";
import { PageHeader } from "@/components/app/page-header";
import { PreferencesForm } from "@/components/app/preferences-form";
import { getSavedAnswers } from "@/lib/answers/store";
import { requireUserId } from "@/lib/auth";
import { getPreferences } from "@/lib/preferences-store";

import { saveAnswersAction, savePreferencesAction } from "@/app/actions/preferences";

export const metadata = { title: "Preferences" };
// Saving preferences searches aggregators and scores matches in `after()`; give it room.
export const maxDuration = 300;

export default async function PreferencesPage() {
  const userId = await requireUserId();
  const [preferences, saved] = await Promise.all([getPreferences(userId), getSavedAnswers(userId)]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Preferences" description="What you’re looking for, and the answers we reuse on every application." />
      <section className="surface p-6">
        <h2 className="font-semibold">Job search</h2>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">We search job boards for these roles and score each posting against your profile.</p>
        <PreferencesForm initial={preferences} action={savePreferencesAction} />
      </section>
      <section className="surface p-6">
        <h2 className="font-semibold">Screening answers</h2>
        <p className="mt-1 mb-6 max-w-2xl text-sm text-muted-foreground">
          Answer once and we’ll fill these in on every application, worded to match each employer’s form. Anything left as
          “Ask me each time” is never guessed.
        </p>
        <AnswersForm saved={saved} action={saveAnswersAction} />
      </section>
    </div>
  );
}
