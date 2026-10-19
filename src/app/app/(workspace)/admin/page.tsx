import { CheckCircle2, Circle, Users } from "lucide-react";
import { headers } from "next/headers";

import { compPlanAction, grantCreditsAction, revokeCompAction } from "@/app/actions/admin";
import { AdminUserActions } from "@/components/admin/admin-user-actions";
import { CopyButton } from "@/components/admin/copy-button";
import { PageHeader } from "@/components/app/page-header";
import { getAdminStats, listRecentGrants, listUsersForAdmin, listWaitlist, requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin" };

const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function ago(iso: string, now: number) {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 60) return "just now";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="surface p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function Step({ done, label }: { done: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${done ? "text-foreground" : "text-muted-foreground"}`}>
      {done ? <CheckCircle2 className="size-3.5 text-primary" aria-hidden="true" /> : <Circle className="size-3.5" aria-hidden="true" />}
      {label}
    </span>
  );
}

export default async function AdminPage() {
  await requireAdmin();
  const [stats, users, waitlist, grants, requestHeaders] = await Promise.all([
    getAdminStats(),
    listUsersForAdmin(),
    listWaitlist(),
    listRecentGrants(),
    headers(),
  ]);
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "applyfold.vercel.app";
  const inviteLink = `${host.startsWith("localhost") ? "http" : "https"}://${host}/sign-up`;
  const now = new Date().getTime();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Admin"
        description="Everyone who signed up, what they've done, and credits for beta testers. Only owner accounts can see this page."
        actions={<CopyButton text={inviteLink} label="Copy invite link" />}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Stat label="Users" value={stats.users} />
        <Stat label="New this week" value={stats.newThisWeek} />
        <Stat label="Onboarded" value={stats.onboarded} />
        <Stat label="Active this week" value={stats.activeThisWeek} />
        <Stat label="Drafts this month" value={stats.draftsThisMonth} />
        <Stat label="AI spend this month" value={`$${stats.aiSpendThisMonth.toFixed(2)}`} />
        <Stat label="Waitlist" value={stats.waitlist} />
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="users-heading">
        <h2 id="users-heading" className="flex items-center gap-2 font-semibold">
          <Users className="size-4" aria-hidden="true" /> Users ({users.length})
        </h2>
        <p className="text-sm text-muted-foreground">
          Bonus drafts never expire and are used after the monthly free allowance. Comped plans run for the chosen number
          of days, then drop back to Free.
        </p>
        <ul className="flex flex-col gap-3">
          {users.map((user) => {
            const compActive = user.planSource === "comp" && Boolean(user.planExpiresAt) && new Date(user.planExpiresAt!).getTime() > now;
            return (
              <li key={user.id} className="surface grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{user.email || "(no email)"}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.isOwner || user.plan !== "Free" ? "bg-ink text-ink-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {user.plan}
                      {compActive ? ` · comp until ${day(user.planExpiresAt!)}` : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Joined {day(user.createdAt)} · seen {ago(user.lastSeenAt, now)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                    <Step done={user.hasResume} label="Resume" />
                    <Step done={user.onboarded} label="Onboarded" />
                    <Step done={user.applications > 0} label={`${user.applications} applications`} />
                  </div>
                  <p className="mt-3 text-sm">
                    <span className="font-medium tabular-nums">{user.draftsThisMonth}</span>{" "}
                    <span className="text-muted-foreground">drafts this month</span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="font-medium tabular-nums">{user.bonusDrafts}</span>{" "}
                    <span className="text-muted-foreground">bonus drafts left</span>
                  </p>
                </div>
                {user.isOwner ? (
                  <p className="text-sm text-muted-foreground lg:self-center">Owner account: unlimited, nothing to grant.</p>
                ) : (
                  <AdminUserActions
                    userId={user.id}
                    email={user.email}
                    compActive={compActive}
                    grantAction={grantCreditsAction}
                    compAction={compPlanAction}
                    revokeAction={revokeCompAction}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-5" aria-labelledby="grants-heading">
          <h2 id="grants-heading" className="font-semibold">
            Recent grants
          </h2>
          {grants.length ? (
            <ul className="mt-3 flex flex-col divide-y text-sm">
              {grants.map(({ grant, email }) => (
                <li key={grant.id} className="flex flex-wrap justify-between gap-2 py-2">
                  <span>
                    <span className="font-medium">{email}</span>{" "}
                    <span className="text-muted-foreground">
                      {grant.kind === "tailored_application"
                        ? `+${grant.amount} drafts`
                        : grant.kind === "plan:revoked"
                          ? "comp revoked"
                          : `${grant.kind.replace("plan:", "")} for ${grant.amount} days`}
                      {grant.note ? ` · ${grant.note}` : ""}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">{day(grant.createdAt.toISOString())}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No grants yet.</p>
          )}
        </section>

        <section className="surface p-5" aria-labelledby="waitlist-heading">
          <div className="flex items-center justify-between gap-2">
            <h2 id="waitlist-heading" className="font-semibold">
              Waitlist ({waitlist.length})
            </h2>
            {waitlist.length ? <CopyButton text={waitlist.map((entry) => entry.email).join(", ")} label="Copy emails" /> : null}
          </div>
          {waitlist.length ? (
            <ul className="mt-3 flex max-h-80 flex-col divide-y overflow-y-auto text-sm">
              {waitlist.map((entry) => (
                <li key={entry.id} className="flex justify-between gap-2 py-2">
                  <span className="truncate">{entry.email}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {entry.role ?? "—"} · {day(entry.createdAt.toISOString())}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Nobody on the Autopilot waitlist yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
