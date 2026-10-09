import { LegalPage } from "@/components/legal-page";
import { brand } from "@/lib/brand";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy">
      <p>
        {brand.name} helps you apply for jobs using information you give us. This page explains what we collect,
        why, and how you stay in control of it.
      </p>
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Account details: your name and email, through our sign-in provider.</li>
          <li>Your resume and the profile we build from it, which you can review and edit.</li>
          <li>Job preferences and the screening answers you choose to save.</li>
          <li>The applications you draft and track, and an activity log of what the assistant did for you.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To match you with jobs and draft applications using only facts from your profile.</li>
          <li>
            To generate drafts with an AI model provider. Your data is sent only to produce the drafts you ask for.
          </li>
          <li>We never sell your data and never submit an application without your approval.</li>
        </ul>
      </section>
      <section>
        <h2>How we protect it</h2>
        <p>
          Your profile, resume text, saved answers and cover letters are encrypted at rest. Files are stored
          privately and are only accessible to your account.
        </p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>
          You can export everything we hold about you, or delete your account and all of its data, from your
          settings at any time. Demographic questions on applications default to &ldquo;Decline to
          self-identify&rdquo; unless you choose otherwise.
        </p>
      </section>
    </LegalPage>
  );
}
