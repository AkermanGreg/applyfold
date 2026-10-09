import { AnswersForm } from "@/components/app/answers-form";
import { PreferencesForm } from "@/components/app/preferences-form";
import { getSavedAnswers } from "@/lib/answers/store";
import { requireUserId } from "@/lib/auth";
import { getPreferences } from "@/lib/preferences-store";

import { saveAnswersAction, savePreferencesAction } from "./actions";

export const metadata = { title: "Preferences" };
// Saving preferences searches aggregators and scores matches in `after()`; give it room.
export const maxDuration = 300;

export default async function PreferencesPage() {
  const userId = await requireUserId();
  const [preferences, saved] = await Promise.all([getPreferences(userId), getSavedAnswers(userId)]);

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">What you’re looking for</h1>
          <p className="mt-1 text-muted-foreground">We use this to search job boards and score each role.</p>
        </header>
        <PreferencesForm initial={preferences} action={savePreferencesAction} />
      </section>
      <section className="flex flex-col gap-6 border-t pt-10">
        <header>
          <h2 className="text-xl font-semibold tracking-tight">Screening answers</h2>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Answer these once and we’ll reuse them on every application, worded to match each employer’s form.
            Anything left as “ask me” is never guessed.
          </p>
        </header>
        <AnswersForm saved={saved} action={saveAnswersAction} />
      </section>
    </div>
  );
}
