import { LegalPage } from "@/components/legal-page";
import { brand } from "@/lib/brand";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms">
      <p>By using {brand.name} you agree to these terms.</p>
      <section>
        <h2>You stay responsible for what you send</h2>
        <p>
          {brand.name} drafts applications from the information you provide. Review every draft before you
          submit it. Keep your profile accurate: the assistant will not invent facts, and you should not ask it
          to.
        </p>
      </section>
      <section>
        <h2>Fair use</h2>
        <ul>
          <li>No mass or automated applying to roles you would not genuinely accept.</li>
          <li>
            The assistant will not solve captchas, create accounts or type passwords for you. Those steps are
            handed back to you.
          </li>
          <li>Plan limits apply as described on the pricing page.</li>
        </ul>
      </section>
      <section>
        <h2>Job listings</h2>
        <p>
          Listings come from public job boards and partner APIs and link back to the original posting. We do
          not guarantee that a listing is still open or that an employer will respond.
        </p>
      </section>
      <section>
        <h2>Subscriptions</h2>
        <p>
          Paid plans renew automatically until cancelled. You can cancel at any time from your billing settings;
          access continues until the end of the paid period.
        </p>
      </section>
    </LegalPage>
  );
}
